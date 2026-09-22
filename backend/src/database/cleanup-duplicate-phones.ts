import { DataSource } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';

/**
 * This script finds and removes duplicate phone numbers from the database.
 * It keeps the most recently created user for each phone number.
 */

export async function cleanupDuplicatePhones(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);

  // Find all duplicate phone numbers
  const duplicates = await userRepo
    .createQueryBuilder('user')
    .select('user.phone', 'phone')
    .addSelect('COUNT(*)', 'count')
    .groupBy('user.phone')
    .having('COUNT(*) > 1')
    .getRawMany();

  console.log(`Found ${duplicates.length} phone numbers with duplicates`);

  let totalDeleted = 0;

  for (const { phone, count } of duplicates) {
    console.log(`Processing phone ${phone} (${count} duplicates)`);

    // Get all users with this phone, ordered by creation date (newest first)
    const users = await userRepo.find({
      where: { phone },
      order: { createdAt: 'DESC' },
    });

    // Keep the first (newest) user, delete the rest
    const toKeep = users[0];
    const toDelete = users.slice(1);

    console.log(`  Keeping user ${toKeep.id} (${toKeep.fullName})`);
    console.log(`  Deleting ${toDelete.length} duplicate users`);

    for (const user of toDelete) {
      console.log(`    Deleting user ${user.id} (${user.fullName})`);
      await userRepo.delete(user.id);
      totalDeleted++;
    }
  }

  console.log(`Total users deleted: ${totalDeleted}`);
  return { totalDeleted, duplicateCount: duplicates.length };
}
