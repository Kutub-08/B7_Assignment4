import express, { application, Application } from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import { authRouter } from "./models/auth/auth.route";
import globalHandler from "./middleware/globalErrorHandler";
import { technicianRouter } from "./models/technician/technician.route";
import { adminRouter } from "./models/admin/admin.route";
import { serviceRouter } from "./models/service/service.route";
import { categoryRouter } from "./models/category/category.route";
import { bookingRouter } from "./models/booking/booking.route";
import { paymentRouter } from "./models/payment/payment.route";
import { json } from "zod";
import { reviewRouter } from "./models/review/review.route";
import { routeNotFoundHandler } from "./middleware/routeNotFound";


const app : Application = express();

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}))

app.post("/api/payment/confirm", express.raw({ type: "application/json" }))

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())


app.get("/",(req, res) => {
    res.json({
        message: "Hello welcome to my project",
        author: "Masad Rayan"
    })
})

app.use("/api/auth", authRouter);
app.use("/api/technician", technicianRouter);
app.use("/api/admin", adminRouter);
app.use("/api/services", serviceRouter);
app.use("/api/category", categoryRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/review", reviewRouter); 

app.use(routeNotFoundHandler)

app.use(globalHandler)


export default app