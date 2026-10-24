import { Response } from "express";
import EquipmentModel from "../models/equipment.model";
import LoanModel from "../models/loan.model";
import { IReqUser } from "../middlewares/auth";
import { computeDashboard } from "../services/dashboard-service";
import { env } from "../utils/env";
import response from "../utils/response";

const LIST_LIMIT = 10;

export default {
  async get(req: IReqUser, res: Response) {
    try {
      const isAdmin = req.user?.role === "admin";
      const loanFilter: any = { returnedAt: null };
      // Technicians only ever see their own loans (filter comes from the token).
      if (!isAdmin) loanFilter.technician = req.user!.id;

      const openLoans: any[] = await LoanModel.find(loanFilter)
        .populate("equipment", "name serial")
        .populate("technician", "name")
        .sort({ borrowedAt: 1 })
        .lean();

      if (!isAdmin) {
        return response.success(res, { activeLoans: openLoans.length, loans: openLoans }, "success get dashboard");
      }

      const equipment: any[] = await EquipmentModel.find()
        .select("name serial status condition nextCalibration category")
        .populate("category", "name")
        .lean();
      const d = computeDashboard({ equipment, openLoans }, new Date(), {
        overdueDays: env.OVERDUE_DAYS,
        calibrationDays: 30,
      });
      response.success(
        res,
        {
          equipmentByStatus: d.equipmentByStatus,
          equipmentByCondition: d.equipmentByCondition,
          activeLoans: d.activeLoans,
          overdueLoansCount: d.overdueLoans.length,
          overdueLoans: d.overdueLoans.slice(0, LIST_LIMIT),
          calibrationDueCount: d.calibrationDue.length,
          calibrationDue: d.calibrationDue.slice(0, LIST_LIMIT),
          equipmentByCategory: d.equipmentByCategory,
          overdueDays: env.OVERDUE_DAYS,
        },
        "success get dashboard"
      );
    } catch (error) {
      response.error(res, error, "failed to get dashboard");
    }
  },
};
