import express from "express";
import authController from "../controllers/auth.controller";
import categoryController from "../controllers/category.controller";
import equipmentController from "../controllers/equipment.controller";
import loanController from "../controllers/loan.controller";
import telegramController from "../controllers/telegram.controller";
import scanController from "../controllers/scan.controller";
import dashboardController from "../controllers/dashboard.controller";
import userController from "../controllers/user.controller";
import locationController from "../controllers/location.controller";
import { authMiddleware } from "../middlewares/auth";
import { requireRole } from "../middlewares/role";

const router = express.Router();

router.post("/auth/login", authController.login);
router.get("/auth/me", authMiddleware, authController.me);

// Manager = pengawas: boleh melihat (GET) data operasional, tidak boleh mengubah.
const viewer = [authMiddleware, requireRole("admin", "manager")];

router.get("/users", ...viewer, userController.findAll);
router.post("/users", authMiddleware, requireRole("admin"), userController.create);
router.put("/users/:id", authMiddleware, requireRole("admin"), userController.update);
// Hapus akun permanen (admin). Ditolak bila akun masih memegang alat atau akun sendiri.
router.delete("/users/:id", authMiddleware, requireRole("admin"), userController.remove);

const admin = [authMiddleware, requireRole("admin")];
const anyUser = [authMiddleware];

router.get("/categories", ...anyUser, categoryController.findAll);
router.post("/categories", ...admin, categoryController.create);
router.put("/categories/:id", ...admin, categoryController.update);
router.delete("/categories/:id", ...admin, categoryController.remove);

router.get("/equipment", ...anyUser, equipmentController.findAll);
router.get("/equipment/:id", ...anyUser, equipmentController.findOne);
router.post("/equipment", ...admin, equipmentController.create);
router.put("/equipment/:id", ...admin, equipmentController.update);

router.get("/loans/mine", ...anyUser, loanController.mine);
router.get("/loans", ...anyUser, loanController.findAll);
router.post("/loans", ...admin, loanController.create);
router.post("/loans/:id/return", ...admin, loanController.return);

// Scan QR alat: GET hanya membaca; pinjam/kembali hanya untuk teknisi dan atas nama dirinya sendiri.
const technician = [authMiddleware, requireRole("technician")];
router.get("/scan/borrowed", ...anyUser, scanController.borrowed);
router.get("/scan/category/:id", ...anyUser, scanController.category);
router.get("/scan/:serial", ...anyUser, scanController.info);
router.post("/scan/:serial/borrow", ...technician, scanController.borrow);
router.post("/scan/:serial/return", ...technician, scanController.return);

// Lokasi HP teknisi: teknisi check-in, admin melihat peta.
router.post("/locations/checkin", ...technician, locationController.checkin);
router.get("/locations", ...viewer, locationController.list);
router.get("/locations/tracker", ...technician, locationController.tracker);
router.post("/locations/tracker", ...technician, locationController.newTracker);
// Aplikasi Traccar Client (tracking latar belakang): tanpa JWT, dijaga ID perangkat acak per teknisi.
router.post("/traccar", locationController.traccar);
router.get("/traccar", locationController.traccar);

// Bot Telegram: tanpa JWT, dijaga header rahasia Telegram.
router.post("/telegram/webhook", telegramController.webhook);
router.get("/telegram/setup", telegramController.setup);
// Ringkasan pagi otomatis (Vercel Cron, dijaga CRON_SECRET).
router.get("/telegram/daily", telegramController.daily);

router.get("/dashboard", ...anyUser, dashboardController.get);

export default router;
