import { Response } from "express";
import * as Yup from "yup";
import UserModel from "../models/user.model";
import { IReqUser } from "../middlewares/auth";
import { signToken } from "../utils/jwt";
import { verifyPassword } from "../utils/password";
import { checkLock, loginKey, recordFailure, recordSuccess } from "../services/login-guard";
import { mongoAttemptStore } from "../services/login-attempt-store";
import response from "../utils/response";

const loginDTO = Yup.object({
  email: Yup.string().trim().required("Email wajib diisi"),
  password: Yup.string().required("Password wajib diisi"),
});

const tooMany = (res: Response, minutesLeft: number) =>
  response.tooMany(res, "too many login attempts", {
    password: `Terlalu banyak percobaan login. Coba lagi dalam ${minutesLeft} menit.`,
  });

export default {
  async login(req: IReqUser, res: Response) {
    try {
      const { email, password } = await loginDTO.validate(req.body ?? {}, { abortEarly: false });
      const key = loginKey(email);
      const lock = await checkLock(mongoAttemptStore, key, new Date());
      if (lock.locked) return tooMany(res, lock.minutesLeft);
      const user: any = await UserModel.findOne({ email: key }).select("+password");
      if (!user || !verifyPassword(password, user.password)) {
        const after = await recordFailure(mongoAttemptStore, key, new Date());
        if (after.locked) return tooMany(res, after.minutesLeft);
        return response.badRequest(res, "failed to login", { password: "Email atau password salah" });
      }
      await recordSuccess(mongoAttemptStore, key);
      if (!user.isActive) return response.unauthorized(res, "account is not active");
      const token = signToken({ id: String(user._id), role: user.role });
      response.success(res, token, "login success");
    } catch (error) {
      response.error(res, error, "failed to login");
    }
  },
  async me(req: IReqUser, res: Response) {
    try {
      const user = await UserModel.findById(req.user?.id);
      if (!user || !(user as any).isActive) return response.unauthorized(res, "account is not active");
      response.success(res, user, "success get profile");
    } catch (error) {
      response.error(res, error, "failed to get profile");
    }
  },
};
