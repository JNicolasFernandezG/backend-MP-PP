import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ nullable: true })
  subscriptionId: string; // ID de la suscripción en Mercado Pago

  @Column({ default: false })
  isPremium: boolean; // Si el usuario tiene suscripción activa

  @Column({ nullable: true })
  subscriptionStartDate: Date; // Fecha cuando inició la suscripción

  @Column({ nullable: true })
  subscriptionEndDate: Date; // Fecha cuando se canceló la suscripción

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}