import { PrismaClient } from '@prisma/client';
import { convertToLocalhostUrl } from '../src/utils/constants';

const prisma = new PrismaClient();

async function updateMediaUrls() {
  console.log('Starting media URL update...\n');

  try {
    // Get all reports with media URLs
    const reports = await prisma.violationReport.findMany({
      where: {
        OR: [
          { photoUrl: { not: null } },
          { videoUrl: { not: null } }
        ]
      },
      select: {
        id: true,
        photoUrl: true,
        videoUrl: true
      }
    });

    console.log(`Found ${reports.length} reports with media URLs\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const report of reports) {
      let needsUpdate = false;
      const updates: any = {};

      // Check photoUrl
      if (report.photoUrl) {
        const newPhotoUrl = convertToLocalhostUrl(report.photoUrl);
        if (newPhotoUrl !== report.photoUrl) {
          updates.photoUrl = newPhotoUrl;
          needsUpdate = true;
          console.log(`Report ${report.id}: Updating photoUrl from ${report.photoUrl} to ${newPhotoUrl}`);
        }
      }

      // Check videoUrl
      if (report.videoUrl) {
        const newVideoUrl = convertToLocalhostUrl(report.videoUrl);
        if (newVideoUrl !== report.videoUrl) {
          updates.videoUrl = newVideoUrl;
          needsUpdate = true;
          console.log(`Report ${report.id}: Updating videoUrl from ${report.videoUrl} to ${newVideoUrl}`);
        }
      }

      // Update if needed
      if (needsUpdate) {
        await prisma.violationReport.update({
          where: { id: report.id },
          data: updates
        });
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`\nUpdate completed!`);
    console.log(`Updated: ${updatedCount} reports`);
    console.log(`Skipped: ${skippedCount} reports (no changes needed)`);

  } catch (error) {
    console.error('Error updating media URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateMediaUrls()
  .catch(console.error);
