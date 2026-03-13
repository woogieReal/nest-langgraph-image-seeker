import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('preferences')
export class Preference {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    category: string;

    @Column()
    imageUrl: string;

    @Column({ type: 'vector', length: 1536, nullable: true })
    embedding?: number[];

    @Column({ type: 'jsonb', nullable: true })
    metadata?: any;
}
