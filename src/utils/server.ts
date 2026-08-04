import app from "./app";
import config from "./config";
import { prisma } from "./lib/prisma";

const main = async () => {
    try {
        await prisma.$connect();
        console.log("Connected to the database")
        app.listen(config.port, () => {
        console.log(`Server is running on port ${config.port}`)
    })
    } catch (error: any) {
        console.log("Error Starting in the serevr" , error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

main()