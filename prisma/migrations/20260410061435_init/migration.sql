-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "visaType" TEXT NOT NULL DEFAULT '',
    "interviewDate" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT '',
    "university" TEXT NOT NULL DEFAULT '',
    "program" TEXT NOT NULL DEFAULT '',
    "subject" TEXT NOT NULL DEFAULT '',
    "fundingStatus" TEXT NOT NULL DEFAULT '',
    "intake" TEXT NOT NULL DEFAULT '',
    "universityName" TEXT NOT NULL DEFAULT '',
    "cgpa" TEXT NOT NULL DEFAULT '',
    "gre" TEXT NOT NULL DEFAULT '',
    "ieltsOther" TEXT NOT NULL DEFAULT '',
    "researchPublication" TEXT NOT NULL DEFAULT '',
    "workExperience" TEXT NOT NULL DEFAULT '',
    "facebookProfileUrl" TEXT NOT NULL DEFAULT '',
    "rawPost" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);
