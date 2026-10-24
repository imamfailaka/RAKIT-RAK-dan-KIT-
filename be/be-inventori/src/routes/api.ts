import express from "express";
import authController from "../controllers/auth.controller";
import categoryController from "../controllers/category.controller";
import equipmentController from "../controllers/equipment.controller";
import loanController from "../controllers/loan.controller";
import scanController from "../controllers/scan.controller";
import dashboardController from "../controllers/dashboard.controller";
import userController from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth";
import { requireRole } from "../middlewares/role";

const router = express.Router();

router.post("/auth/login", authController.login);
router.get("/auth/me", authMiddleware, authController.me);

router.get("/users", authMiddleware, requireRole("admin"), userController.findAll);
router.post("/users", authMiddleware, requireRole("admin"), userController.create);
router.put("/users/:id", authMiddleware, requireRole("admin"), userController.update);

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

router.get("/dashboard", ...anyUser, dashboardController.get);

export default router;
