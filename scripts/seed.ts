import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Test admin account (hidden - exact credentials from initialize_auth)
  const adminHash = await bcrypt.hash("rdJc#5B4LQ", 12);
  await prisma.utilizador.upsert({
    where: { email: "abacus-43234343@example.com" },
    update: { passwordHash: adminHash, role: "ADMIN", nome: "Admin Sistema", ativo: true },
    create: { email: "abacus-43234343@example.com", passwordHash: adminHash, role: "ADMIN", nome: "Admin Sistema", ativo: true },
  });

  // Admin visível para o utilizador
  const visibleAdminHash = await bcrypt.hash("admin123", 12);
  await prisma.utilizador.upsert({
    where: { email: "admin@eduportal.pt" },
    update: { passwordHash: visibleAdminHash, role: "ADMIN", nome: "Administrador", ativo: true },
    create: { email: "admin@eduportal.pt", passwordHash: visibleAdminHash, role: "ADMIN", nome: "Administrador", ativo: true },
  });

  // Demo professor
  const profHash = await bcrypt.hash("professor123", 12);
  const professor = await prisma.utilizador.upsert({
    where: { email: "professor@eduportal.pt" },
    update: { passwordHash: profHash, role: "PROFESSOR", nome: "Maria Silva" },
    create: { email: "professor@eduportal.pt", passwordHash: profHash, role: "PROFESSOR", nome: "Maria Silva" },
  });

  // Demo aluno
  const alunoHash = await bcrypt.hash("aluno123", 12);
  const aluno = await prisma.utilizador.upsert({
    where: { email: "aluno@eduportal.pt" },
    update: { passwordHash: alunoHash, role: "ALUNO", nome: "Jo\u00e3o Santos" },
    create: { email: "aluno@eduportal.pt", passwordHash: alunoHash, role: "ALUNO", nome: "Jo\u00e3o Santos" },
  });

  // Demo EE
  const eeHash = await bcrypt.hash("encarregado123", 12);
  const ee = await prisma.utilizador.upsert({
    where: { email: "encarregado@eduportal.pt" },
    update: { passwordHash: eeHash, role: "ENCARREGADO", nome: "Ana Santos" },
    create: { email: "encarregado@eduportal.pt", passwordHash: eeHash, role: "ENCARREGADO", nome: "Ana Santos" },
  });

  // Ano Letivo
  const ano = await prisma.anoLetivo.upsert({
    where: { nome: "2025/2026" },
    update: {},
    create: { nome: "2025/2026", ativo: true },
  });

  // Turma
  const turma = await prisma.turma.upsert({
    where: { nome_anoLetivoId: { nome: "7\u00baA", anoLetivoId: ano.id } },
    update: {},
    create: { nome: "7\u00baA", anoLetivoId: ano.id },
  });

  // Associate professor to turma
  await prisma.professorTurma.upsert({
    where: { professorId_turmaId: { professorId: professor.id, turmaId: turma.id } },
    update: {},
    create: { professorId: professor.id, turmaId: turma.id },
  });

  // Associate aluno to turma
  await prisma.turmaAluno.upsert({
    where: { turmaId_alunoId: { turmaId: turma.id, alunoId: aluno.id } },
    update: {},
    create: { turmaId: turma.id, alunoId: aluno.id },
  });

  // Associate EE to aluno
  await prisma.encarregadoEducando.upsert({
    where: { encarregadoId_educandoId: { encarregadoId: ee.id, educandoId: aluno.id } },
    update: {},
    create: { encarregadoId: ee.id, educandoId: aluno.id },
  });

  // Demo trabalho
  await prisma.trabalho.upsert({
    where: { id: "demo-trabalho-1" },
    update: {},
    create: {
      id: "demo-trabalho-1",
      titulo: "Ficha de Matem\u00e1tica - Equa\u00e7\u00f5es",
      descricao: "Resolver os exerc\u00edcios da ficha sobre equa\u00e7\u00f5es do 1\u00ba grau.",
      turmaId: turma.id,
      professorId: professor.id,
      deadline: new Date("2026-09-15T23:59:00Z"),
      pesoAvaliacao: 1.0,
      permiteEntregaAposPrazo: true,
    },
  });

  console.log("Seed completed.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
