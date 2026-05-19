import { db } from './db'

export async function generarSnapshotSesion(id) {
  try {
    const sesion = await db.sesiones.get(Number(id));
    if (!sesion) throw new Error(`Sesión ${id} no encontrada.`);

    const [boxeadorRojo, boxeadorAzul, eventos] = await Promise.all([
      db.boxeadores.get(sesion.boxeadorRojoId),
      db.boxeadores.get(sesion.boxeadorAzulId),
      db.eventos.where('sesionId').equals(Number(id)).toArray()
    ]);

    const snapshot = {
      header: `[SYNC_REQUEST] Sesión ID: ${id}`,
      sesion: {
        id: sesion.id,
        fecha: sesion.fecha,
        rounds: sesion.rounds,
        videoPath: sesion.videoPath,
        createdAt: sesion.createdAt
      },
      boxeadores: {
        rojo: {
          nombre: boxeadorRojo?.nombre,
          apodo: boxeadorRojo?.apodo,
          categoriaPeso: boxeadorRojo?.categoriaPeso,
          estancia: boxeadorRojo?.estancia,
          notas: boxeadorRojo?.notas
        },
        azul: {
          nombre: boxeadorAzul?.nombre,
          apodo: boxeadorAzul?.apodo,
          categoriaPeso: boxeadorAzul?.categoriaPeso,
          estancia: boxeadorAzul?.estancia,
          notas: boxeadorAzul?.notas
        }
      },
      telemetria: {
        totalEventos: eventos.length,
        timeline: eventos.map(e => ({
          ts: e.timestamp,
          tipo: e.tipo,
          esquina: e.esquina,
          nota: e.nota
        }))
      },
      videoMetadata: {
        filename: sesion.videoPath?.split('\\').pop() || sesion.videoPath?.split('/').pop(),
        protocol: "daneri-file://"
      }
    };

    console.log("Snapshot Generado:", snapshot);
    return snapshot;
  } catch (error) {
    console.error("Error generando snapshot:", error);
    return { error: error.message };
  }
}
