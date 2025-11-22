import { sanitizeUser } from "../services/authService.js";
import { updateDisplayName, getUserById } from "../repositories/userRepository.js";
import {
  ensureWallet,
  getWallet,
  listWalletTransactions,
} from "../repositories/walletRepository.js";
import { listInventory } from "../repositories/inventoryRepository.js";
import { purchaseOffer, sellCosmetic } from "../services/playerEconomyService.js";

export async function getProfile(req, res, next) {
  try {
    res.status(200).json({ user: req.user });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const displayName = req.body?.displayName?.trim();
    if (!displayName || displayName.length < 3) {
      const err = new Error("displayName precisa ter ao menos 3 caracteres");
      err.status = 400;
      throw err;
    }

    const updated = await updateDisplayName(req.user.id, displayName);
    res.status(200).json({ user: sanitizeUser(updated) });
  } catch (error) {
    next(error);
  }
}

export async function getWalletSummary(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;
    await ensureWallet(req.user.id);
    const wallet = await getWallet(req.user.id);
    const transactions = await listWalletTransactions(req.user.id, { limit, offset });
    res.status(200).json({
      balance: wallet ? Number(wallet.balance) : 0,
      updatedAt: wallet?.updated_at ?? null,
      transactions,
    });
  } catch (error) {
    next(error);
  }
}

export async function listUserInventory(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const items = await listInventory(req.user.id, { limit, offset });
    res.status(200).json({ items });
  } catch (error) {
    next(error);
  }
}

export async function purchaseShopOffer(req, res, next) {
  try {
    const offerId = req.body?.offerId;
    const result = await purchaseOffer(req.user.id, offerId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function sellInventoryItem(req, res, next) {
  try {
    const cosmeticIds = Array.isArray(req.body?.cosmeticIds)
      ? req.body.cosmeticIds
      : req.body?.cosmeticId ?? null;
    const result = await sellCosmetic(req.user.id, cosmeticIds);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function refreshProfile(req, res, next) {
  try {
    const fresh = await getUserById(req.user.id);
    res.status(200).json({ user: sanitizeUser(fresh) });
  } catch (error) {
    next(error);
  }
}