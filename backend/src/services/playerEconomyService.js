import pool from "../db/pool.js";
import {
  ensureWallet,
  getWallet,
  updateWalletBalance,
  createWalletTransaction,
  getLastPurchaseAmount,
} from "../repositories/walletRepository.js";
import {
  incrementInventory,
  getInventoryItems,
  listInventoryItemsByOffer,
  removeInventoryItems,
} from "../repositories/inventoryRepository.js";
import {
  getShopEntryById,
  getLatestPriceForCosmetic,
} from "../repositories/shopRepository.js";

function resolveOfferPrice(offer) {
  const price = offer.final_price ?? offer.regular_price;
  return typeof price === "number" && price > 0 ? price : null;
}

function formatBundleLabel(prefix, { name, count }) {
  if (name?.trim()) {
    return `${prefix} (${name.trim()})`;
  }
  const safeCount = typeof count === "number" && count > 0 ? `${count} Itens` : "Itens";
  return `${prefix} ${safeCount}`;
}

function buildPurchaseDescription(offer) {
  if (offer.is_bundle) {
    return formatBundleLabel("Compra Bundle", {
      name: offer.bundle_name,
      count: offer.items?.length,
    });
  }

  const firstItem = offer.items?.[0];
  const label = firstItem?.name?.trim() || firstItem?.id || "Item desconhecido";
  return `Compra Item (${label})`;
}

function buildSaleDescription({ itemName, bundleName, bundleCount, isBundle }) {
  if (isBundle) {
    return formatBundleLabel("Venda Bundle", {
      name: bundleName,
      count: bundleCount,
    });
  }
  const label = itemName?.trim() || "Item desconhecido";
  return `Venda Item (${label})`;
}

function salePriceFromReference(reference) {
  const base = reference?.final_price ?? reference?.regular_price ?? 200;
  return Math.max(50, Math.floor(base * 0.5));
}

function normalizeCosmeticIds(input) {
  if (!input) {
    return [];
  }

  const rawList = Array.isArray(input) ? input : [input];
  const filtered = rawList
    .map((value) => (typeof value === "string" ? value.trim() : String(value ?? "").trim()))
    .filter(Boolean);

  return [...new Set(filtered)];
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
        metadata: {
          offerId,
          itemIds: (offer.items ?? []).map((item) => item.id).filter(Boolean),
        },
      },
      client
    );

    for (const item of offer.items) {
      await incrementInventory({ userId, cosmeticId: item.id, offerId }, client);
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

export async function sellCosmetic(userId, cosmetics) {
  const cosmeticIds = normalizeCosmeticIds(cosmetics);
  if (!cosmeticIds.length) {
    const error = new Error("Informe ao menos um cosmeticId");
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const items = await getInventoryItems(userId, cosmeticIds, { forUpdate: true, client });
    if (items.length !== cosmeticIds.length) {
      const error = new Error("Alguns itens não foram encontrados no inventário");
      error.status = 400;
      throw error;
    }

    const offerIds = new Set(items.map((entry) => entry.offer_id).filter(Boolean));
    let targetOfferId = null;
    let relatedItems = items;
    let isBundleSale = false;

    if (cosmeticIds.length > 1) {
      if (offerIds.size !== 1) {
        const error = new Error("Para vender múltiplos itens todos devem pertencer ao mesmo bundle");
        error.status = 400;
        throw error;
      }

      targetOfferId = [...offerIds][0];
      if (!targetOfferId) {
        const error = new Error("Não é possível vender múltiplos itens individuais em um único pedido");
        error.status = 400;
        throw error;
      }

      const offerInventory = await listInventoryItemsByOffer(userId, targetOfferId, {
        forUpdate: true,
        client,
      });

      const offerInventoryIds = offerInventory.map((entry) => entry.cosmetic_id).sort();
      const providedIds = [...cosmeticIds].sort();
      const missingItems = offerInventoryIds.length !== providedIds.length;
      const mismatch = missingItems || offerInventoryIds.some((id, idx) => id !== providedIds[idx]);

      if (mismatch) {
        const error = new Error("Para vender um bundle envie todos os itens adquiridos naquele pacote");
        error.status = 400;
        throw error;
      }

      relatedItems = offerInventory;
      isBundleSale = relatedItems.length > 1;
    } else if (offerIds.size === 1) {
      targetOfferId = [...offerIds][0];
      if (targetOfferId) {
        const offerInventory = await listInventoryItemsByOffer(userId, targetOfferId, {
          forUpdate: true,
          client,
        });
        if (offerInventory.length > 1) {
          const error = new Error(
            "Para vender um bundle envie todos os itens do pacote em cosmeticIds"
          );
          error.status = 400;
          throw error;
        }
      }
    }

    let referencePrice = null;
    if (targetOfferId && isBundleSale) {
      referencePrice = await getShopEntryById(targetOfferId, client);
    }
    if (!referencePrice) {
      referencePrice = await getLatestPriceForCosmetic(relatedItems[0].cosmetic_id, client);
    }

    let salePrice = null;
    if (targetOfferId) {
      const lastPurchaseAmount = await getLastPurchaseAmount({ userId, offerId: targetOfferId }, client);
      if (typeof lastPurchaseAmount === "number" && lastPurchaseAmount > 0) {
        salePrice = lastPurchaseAmount;
      }
    }

    if (!salePrice) {
      salePrice = salePriceFromReference(referencePrice);
    }
    if (!salePrice) {
      const error = new Error("Preço de venda indisponível para este item");
      error.status = 400;
      throw error;
    }

    if (isBundleSale && relatedItems.length <= 1) {
      isBundleSale = false;
    }

    const saleDescription = buildSaleDescription({
      itemName: relatedItems[0]?.cosmetic_name,
      bundleName: referencePrice?.bundle_name,
      bundleCount: isBundleSale ? relatedItems.length : 0,
      isBundle: isBundleSale,
    });

    const relatedCosmeticIds = relatedItems.map((entry) => entry.cosmetic_id);
    const removed = await removeInventoryItems(userId, relatedCosmeticIds, client);
    if (removed < relatedCosmeticIds.length) {
      const error = new Error("Falha ao remover todos os itens do inventário");
      error.status = 500;
      throw error;
    }

    await ensureWallet(userId, client);
    await getWallet(userId, { forUpdate: true, client });
    await updateWalletBalance(userId, salePrice, client);
    await createWalletTransaction(
      {
        userId,
        amount: salePrice,
        type: "credit",
        description: saleDescription,
        metadata: {
          cosmeticIds: relatedCosmeticIds,
          offerId: targetOfferId ?? null,
          referenceOfferId: referencePrice?.offer_id ?? targetOfferId ?? null,
        },
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