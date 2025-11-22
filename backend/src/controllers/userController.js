import { listUsers, getUserById } from "../repositories/userRepository.js";
import { listInventory } from "../repositories/inventoryRepository.js";
import { getWallet } from "../repositories/walletRepository.js";

function mapPublicUser(user) {
  if (!user) {
    return null;
  }

  const fallbackName = user.email ? user.email.split("@")[0] : null;
  return {
    id: user.id,
    displayName: user.display_name || fallbackName || "Jogador",
    createdAt: user.created_at,
    balance: Number(user.balance ?? 0),
  };
}

export async function listPublicUsers(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const users = await listUsers({ limit, offset });
    res.status(200).json({ users: users.map(mapPublicUser) });
  } catch (error) {
    next(error);
  }
}

export async function getPublicUserInventory(req, res, next) {
  try {
    const { id } = req.params;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const user = await getUserById(id);
    if (!user) {
      const err = new Error("Usuário não encontrado");
      err.status = 404;
      throw err;
    }

    const wallet = await getWallet(id);
    const enrichedUser = {
      ...user,
      balance: wallet?.balance ?? 0,
    };
    const items = await listInventory(id, { limit, offset });
    res.status(200).json({ user: mapPublicUser(enrichedUser), items });
  } catch (error) {
    next(error);
  }
}
