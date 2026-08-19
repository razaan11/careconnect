-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "district" TEXT,
ADD COLUMN     "landmark" TEXT,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "state" TEXT,
ALTER COLUMN "lat" DROP NOT NULL,
ALTER COLUMN "lng" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Trust" ADD COLUMN     "district" TEXT,
ADD COLUMN     "landmark" TEXT,
ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "state" TEXT;
