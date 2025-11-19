import pool from "../db/pool.js";
import {
  ensureWallet,
  getWallet,
  updateWalletBalance,
  createWalletTransaction,
} from "../repositories/walletRepository.js";
import {
  incrementInventory,
  getInventoryItem,
  decrementInventory,
} from "../repositories/inventoryRepository.js";
import {
  getShopEntryById,
  getLatestPriceForCosmetic,
} from "../repositories/shopRepository.js";

function resolveOfferPrice(offer) {
  const price = offer.final_price ?? offer.regular_price;
  return typeof price === "number" && price > 0 ? price : null;
}

function buildPurchaseDescription(offer) {
  if (offer.bundle_name) {
    return `Compra bundle ${offer.bundle_name}`;
  }
  const firstItem = offer.items?.[0];
  if (firstItem?.name) {
    return `Compra ${firstItem.name}`;
  }
  return "Compra de oferta";
}

function buildSaleDescription(cosmeticId) {
  return `Venda ${cosmeticId}`;
}

function salePriceFromReference(reference) {
  const base = reference?.final_price ?? reference?.regular_price ?? 200;
  return Math.max(50, Math.floor(base * 0.5));
}

export async function purchaseOffer(userId, offerId) {
  if (!offerId) {
    const error = new Error("offerId é obrigatório");
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const offer = await getShopEntryById(offerId, client);
    if (!offer) {
      const error = new Error("Oferta não encontrada");
      error.status = 404;
      throw error;
    }

    if (!offer.items?.length) {
      const error = new Error("Oferta sem itens vinculados");
      error.status = 400;
      throw error;
    }

    const price = resolveOfferPrice(offer);
    if (!price) {
      const error = new Error("Preço inválido para a oferta");
      error.status = 400;
      throw error;
    }

    await ensureWallet(userId, client);
    const wallet = await getWallet(userId, { forUpdate: true, client });
    if (!wallet || wallet.balance < price) {
      const error = new Error("Saldo insuficiente");
      error.status = 400;
      throw error;
    }

    await updateWalletBalance(userId, -price, client);
    await createWalletTransaction(
      {
        userId,
        amount: -price,
        type: "debit",
        description: buildPurchaseDescription(offer),
        metadata: { offerId },
      },
      client
    );

    for (const item of offer.items) {
      await incrementInventory({ userId, cosmeticId: item.id, quantity: 1 }, client);
    }

    await client.query("COMMIT");
    const updatedWallet = await getWallet(userId);
    return {
      wallet: updatedWallet,
      purchasedOffer: offer,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function sellCosmetic(userId, cosmetic) {
  const cosmeticId = typeof cosmetic === "string" ? cosmetic : cosmetic?.cosmeticId ?? cosmetic?.id;
  if (!cosmeticId) {
    const error = new Error("cosmeticId é obrigatório");
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const item = await getInventoryItem(userId, cosmeticId, { forUpdate: true, client });
    if (!item || item.quantity < 1) {
      const error = new Error("Item não encontrado no inventário");
      error.status = 400;
      throw error;
    }

    const referencePrice = await getLatestPriceForCosmetic(cosmeticId, client);
    const salePrice = salePriceFromReference(referencePrice);

    await decrementInventory({ userId, cosmeticId, quantity: 1 }, client);
    await ensureWallet(userId, client);
    await getWallet(userId, { forUpdate: true, client });
    await updateWalletBalance(userId, salePrice, client);
    await createWalletTransaction(
      {
        userId,
        amount: salePrice,
        type: "credit",
        description: buildSaleDescription(cosmeticId),
        metadata: { cosmeticId },
      },
      client
    );

    await client.query("COMMIT");
    const updatedWallet = await getWallet(userId);
    return {
      wallet: updatedWallet,
      salePrice,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}