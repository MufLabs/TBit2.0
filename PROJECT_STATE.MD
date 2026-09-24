# PROJECT_STATE — T-Bit 2.0

> Estado del proyecto según evidencia verificada del repositorio (2026-09-23).
> Este archivo es entrada declarada del Context Engineer y del flujo ECR
> (MUF Labs Engineering Framework). Actualizar en el cierre de cada fase.

## Qué es T-Bit 2.0

Contenedor de datos `.tbit` con interfaz visual 2D/3D (React + Three.js), backend
Express y capa de IA multi-provider con tools, memoria persistente y permisos.

## Estado actual (baseline Fase 0 — VERIFICADO)

- **Almacenamiento (fundación estable, NO tocar):** `TBitStorageService` + `TBitFileSystem` — WAL (`PENDING/COMMITTED/ABORTED`), HMAC-SHA256 con comparación timing-safe sobre metadata, cifrado AES-256-GCM en reposo (obligatorio, requiere `TBIT_ENCRYPTION_SECRET`), snapshots/rollback, réplica, checksum global. Cobertura por tests: `tests/TBitStorageService.smoke.test.ts`.
- **Capa IA actual:** `TBitChatEngine` (ruta SIMPLE con tool-loop de 2 pasos: `auto` → ejecutar tools → `none`), `AiProviderFactory` (10 providers del catálogo), `TBitLocalToolExecutor` (7 tools), `aiPermissions`, `memoryCore`/`queryIndex`/`semanticIndex` sobre `data/ai_memoria.tbit`. Paridad congelada por tests: `tests/TBitChatEngine.parity.test.ts`, `tests/AiProvider.deterministic.test.ts`.
- **Tests:** harness vitest operativo (`npm test`): 26 tests, 4 archivos, todos pasando. Antes de la Fase 0 el repositorio no tenía ningún test.
- **Agentes:** 17 especificaciones en `.github/agents/` (MUF Labs Engineering Framework) — ver `engineering/reports/PHASE-0-AGENT-INVENTORY.md`. Son specs, no runtime. Falta `permissions` y `modelRequirements` (los cubrirá el PolicyOverlay). No existe GraphEngineeringAgent.
- **Flujo de ingeniería:** ECR activo en `engineering/` (ECR-0001). Workflow: carga de contexto → análisis → consenso → implementación → validación → cierre.

## Evolución en curso

Baseline de evolución: `docs/TBit_AI_Evolution_Blueprint.md` (roadmap 0–11).
Regla central: **extender, no reemplazar**. Fuera de scope: Q-Vault, storage físico, WAL, mapas 2D/3D de memoria.

- [x] Fase 0 (parcial): harness de tests + inventario de agentes + paridad de la ruta SIMPLE
- [ ] Fase 0 (restante): baseline de métricas de la ruta SIMPLE; decisión `ai_exec.tbit` (criterios: qué artefactos persisten, retención, aislamiento por usuario; probablemente no necesaria hasta Fase 5)
- [ ] Fase 1: Agent Loader → Registry → PolicyOverlay → Agent Runtime (1 agente, modo off/shadow/on)
- [ ] Fases 2–11: ver blueprint

## Documentación clave

- `docs/TBit_AI_Evolution_Blueprint.md` — plano de evolución (roadmap 0–11)
- `engineering/reports/PHASE-0-AGENT-INVENTORY.md` — inventario real de agentes
- `engineering/reports/phase-0-agent-inventory.json` — inventario machine-readable (`npm run agents:inventory`)
- `docs/T-BIT_BOOK.md`, `docs/README.md` — documentación del sistema

## Comandos

```bash
npm run dev:all        # backend + frontend
npm test               # suite completa (vitest)
npm run agents:inventory
```

