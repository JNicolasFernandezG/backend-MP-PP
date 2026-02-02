import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Script para resetear la base de datos (NO TOQUES!!!)
 * Uso: npx ts-node src/scripts/reset-db.ts --confirm
 *
 * ⚠️ ADVERTENCIA:
 * - Elimina TODAS las tablas de la BD
 * - Deja la BD completamente vacía
 * - Solo usar en development
 * - NUNCA usar en production
 */

async function resetDatabase() {
  // Verificar que se pasó el flag --confirm
  const args = process.argv.slice(2);
  if (!args.includes('--confirm')) {
    console.error(
      '❌ Por seguridad, debes pasar el flag --confirm:\n\n' +
      'npx ts-node src/scripts/reset-db.ts --confirm\n'
    );
    process.exit(1);
  }

  // Verificar que estamos en development
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ¡NO PUEDES EJECUTAR ESTO EN PRODUCCIÓN!');
    process.exit(1);
  }

  try {
    console.log('🔄 Conectando a la base de datos...');

    // Crear conexión a la BD
    const appDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cursos_db',
    });

    await appDataSource.initialize();
    console.log('✅ Conectado a PostgreSQL');

    // Obtener el query runner
    const queryRunner = appDataSource.createQueryRunner();

    try {
      console.log('🗑️  Eliminando todas las tablas...');

      // Obtener todas las tablas del schema public
      const tables = await queryRunner.getTables();

      if (tables.length === 0) {
        console.log('ℹ️  No hay tablas para eliminar');
      } else {
        // Desactivar foreign key checks
        await queryRunner.query('SET session_replication_role = replica;');

        // Eliminar cada tabla
        for (const table of tables) {
          await queryRunner.query(
            `DROP TABLE IF EXISTS "${table.name}" CASCADE`,
          );
          console.log(`  ✓ Tabla ${table.name} eliminada`);
        }

        // Reactivar foreign key checks
        await queryRunner.query('SET session_replication_role = default;');

        console.log(`\n✅ Se eliminaron ${tables.length} tablas`);
      }

      console.log(
        '✅ Base de datos completamente vacía\n' +
        '🔄 Ejecuta: npm run start:dev\n' +
        '   TypeORM reconstruirá las tablas automáticamente (synchronize: true)',
      );
    } finally {
      await queryRunner.release();
      await appDataSource.destroy();
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetDatabase();
