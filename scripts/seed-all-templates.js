const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const templatesData = [
    {
        name: "Operación Estándar - Salón",
        description: "Lista de tareas estándar para la operación diaria de Salón (Apertura, Medio Turno, Cierre)",
        category: "Salón",
        tasks: [
            { title: "Apertura - Limpieza exterior del local", description: "Barrer y limpiar completamente la calle frente al local. Subir video y fotos.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Iluminación exterior y ambientación", description: "Colocar lámparas/series externas y encender anuncios luminosos. Verificar estado.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Limpieza profunda del piso", description: "Trapear todo el piso con cloro. Atención a áreas de alto tránsito.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Organización y limpieza del mobiliario", description: "Verificar mesas y bancos limpios, ordenados y alineados.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Servilleteros listos", description: "Servilleteros limpios y con suficiente papel en cada mesa.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Cartas listas", description: "Cartas libres de suciedad/grasa, ubicadas en cada mesa.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Control de basura y puntos ciegos", description: "Verificar esquinas, recepción, cabina DJ. Vaciar botes y poner bolsa nueva.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Ventilación e iluminación interior", description: "Limpiar y encender ventiladores. Revisar lámparas/candelabros.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Limpieza áreas clave (Caja/Recepción/DJ)", description: "Limpieza total de recepción, caja y cabina de DJ.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Verificación de Internet", description: "Confirmar conexión estable para sistema de pedidos/música.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Equipos de comandas operativos", description: "Comanderas de cocina y barra encendidas y conectadas.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Pantallas encendidas", description: "Todas las pantallas encendidas mostrando información correcta.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Sistema de sonido", description: "Bocinas conectadas, sonido claro sin interferencias.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Iluminación interna integral", description: "Todas las luces de salón, barra y exterior en buen estado.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Letrero LED Promociones", description: "Colocado, conectado y mostrando promociones vigentes.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Limpieza de Baños", description: "Limpieza profunda, insumos repuestos, aromatizado. Pisos, WC, lavamanos.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Mitad de Turno - Limpieza de Piso", description: "Repasar limpieza de pisos con cloro. Áreas de alto tráfico.", defaultLimitTime: "19:00", evidenceType: "PHOTO" },
            { title: "Mitad de Turno - Organización Mobiliario", description: "Re-alinear mesas y bancos. Verificar limpieza.", defaultLimitTime: "19:00", evidenceType: "PHOTO" },
            { title: "Mitad de Turno - Servilleteros", description: "Resurtir servilleteros si es necesario.", defaultLimitTime: "19:00", evidenceType: "PHOTO" },
            { title: "Mitad de Turno - Cartas", description: "Limpiar cartas que se hayan ensuciado.", defaultLimitTime: "19:00", evidenceType: "PHOTO" },
            { title: "Mitad de Turno - Control Basura", description: "Vaciar botes llenos. Verificar puntos ciegos.", defaultLimitTime: "19:00", evidenceType: "PHOTO" },
            { title: "Mitad de Turno - Áreas Clave", description: "Limpieza rápida de barra, caja y recepción.", defaultLimitTime: "19:00", evidenceType: "PHOTO" },
            { title: "Mitad de Turno - Baños", description: "Revisión estado baños. Reponer papel/jabón. Limpieza si requiere.", defaultLimitTime: "19:00", evidenceType: "PHOTO" },
            { title: "Cierre - Limpieza Profunda Piso", description: "Lavado final de pisos con cloro.", defaultLimitTime: "02:00", evidenceType: "PHOTO" },
            { title: "Cierre - Organización Mobiliario", description: "Dejar mesas y sillas listas para el día siguiente (o subidas si aplica).", defaultLimitTime: "02:00", evidenceType: "PHOTO" },
            { title: "Cierre - Servilleteros", description: "Rellenar servilleteros para el turno de mañana.", defaultLimitTime: "02:00", evidenceType: "PHOTO" },
            { title: "Cierre - Cartas", description: "Limpiar y guardar cartas ordenadamente.", defaultLimitTime: "02:00", evidenceType: "PHOTO" },
            { title: "Cierre - Control Basura", description: "Sacar toda la basura del local. Dejar botes limpios con bolsa nueva.", defaultLimitTime: "02:00", evidenceType: "PHOTO" },
            { title: "Cierre - Baños", description: "Lavado final y desinfección de baños.", defaultLimitTime: "02:00", evidenceType: "PHOTO" },
            { title: "Cierre - Apagado Equipos Electrónicos", description: "Pantallas, PCs, impresoras, terminales, bocinas. EXCEPTO DVR.", defaultLimitTime: "02:00", evidenceType: "PHOTO" },
            { title: "Cierre - Verificación DVR", description: "Confirmar que DVR (cámaras) queda ENCENDIDO y grabando.", defaultLimitTime: "02:00", evidenceType: "PHOTO" },
            { title: "Cierre - Desconexión Auxiliares", description: "Humo, luces decorativas, cargadores desconectados.", defaultLimitTime: "02:00", evidenceType: "PHOTO" },
            { title: "Cierre - Superficies Tecnológicas", description: "Limpiar polvo de mesas, consolas, racks.", defaultLimitTime: "02:00", evidenceType: "PHOTO" },
            { title: "Cierre - Cables y Accesorios", description: "Recoger y ordenar cables sueltos.", defaultLimitTime: "02:00", evidenceType: "PHOTO" },
            { title: "Cierre - Áreas Clave", description: "Limpieza final recepción/caja.", defaultLimitTime: "02:00", evidenceType: "PHOTO" }
        ]
    },
    {
        name: "Plantilla de Barra - Operación Completa",
        description: "Checklist integral para la operación diaria de Barra: Apertura, Mitad de Turno y Cierre. Incluye limpieza, preparación de mezclas, stock y mantenimiento.",
        category: "Barra",
        tasks: [
            { title: "Apertura - Limpieza de Barra y Contra Barra", description: "Limpiar superficies, repisas y paredes. Eliminar residuos y manchas. Área seca y ordenada.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Apertura - Limpieza de Licuadoras", description: "Lavar a fondo, desmontar piezas (si aplica), eliminar restos de fruta/azúcar.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Apertura - Limpieza de Piso en Área de Barra", description: "Barrer y trapear con desinfectante. Sin residuos ni líquidos.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Apertura - Limpieza y Organización de Utensilios", description: "Lavar, desinfectar y acomodar todos los utensilios. Ninguno sucio o fuera de lugar.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Apertura - Limpieza Interna del Refrigerador", description: "Retirar lo del turno pasado, limpieza general interior.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Apertura - Revisión de Fechas y Estado", description: "Verificar productos and retirar vencidos o en mal estado.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Apertura - Limpieza Completa de Cristalería", description: "Lavar con agua caliente y detergente. Secar, sin manchas ni olores.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Apertura - Revisión de Integridad de Cristalería", description: "Inspeccionar y descartar cristalería quebrada o astillada.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Apertura - Organización de Cristalería", description: "Ordenar por tipo, tamaño y uso para agilizar servicio.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Apertura - Preparación de Mezclas", description: "Elaborar mezclas sin grumos, en recipientes limpios y etiquetados.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Apertura - Alistamiento de Escarchados", description: "Sal, chile, azúcar listos en recipientes sin humedad excesiva.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Apertura - Control de Calidad de Gomitas", description: "Frescas, sin mezclar tipos, en envases limpios.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Preparación de Garnituras", description: "Cortar y presentar cítricos/frutas. Refrigerar para conservar frescura.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Apertura - Stock de Licores y Cerveza", description: "Revisar stock fuera de barra (bodega/refri). Acomodar por tipo/marca con etiquetas visibles.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Apertura - Acomodo de Cartones Vacíos", description: "Recoger y apilar cartones vacíos ordenadamente, lejos de servicio.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Mitad de Turno - Limpieza de Superficies", description: "Limpiar barras frontales y traseras. Libres de residuos o manchas.", defaultLimitTime: "20:00", evidenceType: "VIDEO" },
            { title: "Mitad de Turno - Limpieza Cristalería y Utensilios", description: "Lavar, secar y acomodar cristalería y herramientas acumuladas.", defaultLimitTime: "20:00", evidenceType: "VIDEO" },
            { title: "Mitad de Turno - Limpieza de Tarjas", description: "Retirar restos de alimento/suciedad de tarjas. Desinfectar.", defaultLimitTime: "20:00", evidenceType: "VIDEO" },
            { title: "Mitad de Turno - Limpieza de Pisos", description: "Barrer y trapear alrededor de la barra. Sin superficies resbalosas.", defaultLimitTime: "20:00", evidenceType: "VIDEO" },
            { title: "Mitad de Turno - Reposición de Insumos", description: "Rellenar servilleteros, popotes, agitadores.", defaultLimitTime: "20:00", evidenceType: "VIDEO" },
            { title: "Mitad de Turno - Orden y Presentación", description: "Barra seca, limpia, organizada y presentable.", defaultLimitTime: "20:00", evidenceType: "VIDEO" },
            { title: "Cierre - Limpieza Total Superficies", description: "Limpieza y desinfección profunda de barras (frontal/trasera).", defaultLimitTime: "02:00", evidenceType: "VIDEO" },
            { title: "Cierre - Lavado Total Cristalería y Utensilios", description: "Todo lavado, seco y guardado en su lugar para mañana.", defaultLimitTime: "02:00", evidenceType: "VIDEO" },
            { title: "Cierre - Limpieza de Tarjas", description: "Tarjas higiénicas y desinfectadas.", defaultLimitTime: "02:00", evidenceType: "VIDEO" },
            { title: "Cierre - Limpieza Profunda Pisos", description: "Barrer y trapear a fondo alrededor de la barra.", defaultLimitTime: "02:00", evidenceType: "VIDEO" },
            { title: "Cierre - Reposición Final de Insumos", description: "Dejar servilleteros y consumibles listos para apertura.", defaultLimitTime: "02:00", evidenceType: "VIDEO" },
            { title: "Cierre - Orden Final de Barra", description: "Área completamente seca y organizada.", defaultLimitTime: "02:00", evidenceType: "VIDEO" },
            { title: "Cierre - Rellenar Refrigeradores Cerveza", description: "Llenar refris para tener cerveza fría en la apertura.", defaultLimitTime: "02:00", evidenceType: "VIDEO" },
            { title: "Cierre - Checar Máquina de Hielo", description: "Dejar funcionando para tener hielo al día siguiente.", defaultLimitTime: "02:00", evidenceType: "VIDEO" }
        ]
    },
    {
        name: "Plantilla de Caja - Operación Completa",
        description: "Checklist integral para la operación diaria de Caja: Apertura, Mitad de Turno y Cierre. Incluye manejo de efectivo, terminales, limpieza y cortes.",
        category: "Caja",
        tasks: [
            { title: "Apertura - Verificación de Terminales", description: "Encendidas, batería 100%, señal y rollo de papel. Conectadas si no se usan.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Apertura - Asignación de Terminales", description: "Ubicar estratégicamente en puntos de mayor uso.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Chequeo de Equipos", description: "Tablets, comanderas y software funcionando, actualizados y con red.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Propineras Limpias", description: "Sin residuos, vacías del turno anterior y en su lugar.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Verificación Fondo de Caja", description: "Confirmar monto completo para operar.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Disponibilidad de Cambio", description: "Suficientes monedas y billetes de diversas denominaciones.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Reposición de Faltantes", description: "Reportar y reponer cualquier faltante antes de abrir.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Mitad de Turno - Limpieza Área Caja", description: "Limpiar mostrador, teclado, pantalla y equipos.", defaultLimitTime: "20:00", evidenceType: "VIDEO" },
            { title: "Mitad de Turno - Organización Dinero", description: "Acomodar billetes, monedas y comprobantes en sus espacios.", defaultLimitTime: "20:00", evidenceType: "VIDEO" },
            { title: "Mitad de Turno - Gestión Basura", description: "Retirar papeles y objetos innecesarios.", defaultLimitTime: "20:00", evidenceType: "PHOTO" },
            { title: "Mitad de Turno - Rollos de Papel", description: "Verificar existencia de rollos para tickets.", defaultLimitTime: "20:00", evidenceType: "PHOTO" },
            { title: "Mitad de Turno - Verificación General", description: "Área limpia, ordenada y funcional para seguir operando.", defaultLimitTime: "20:00", evidenceType: "VIDEO" },
            { title: "Cierre - Limpieza Área Caja", description: "Desinfectar mostrador, pantallas y equipos.", defaultLimitTime: "02:00", evidenceType: "VIDEO" },
            { title: "Cierre - Organización Dinero", description: "Ordenar efectivo y vouchers correctamente.", defaultLimitTime: "02:00", evidenceType: "VIDEO" },
            { title: "Cierre - Gestión Basura", description: "Área despejada de papeles y basura.", defaultLimitTime: "02:00", evidenceType: "PHOTO" },
            { title: "Cierre - Rollos de Papel", description: "Asegurar stock de papel para el día siguiente.", defaultLimitTime: "02:00", evidenceType: "PHOTO" },
            { title: "Cierre - Verificación General", description: "Punto de venta listo para el siguiente turno.", defaultLimitTime: "02:00", evidenceType: "VIDEO" },
            { title: "Cierre - Revisión Corte de Caja", description: "Cuadrar ventas, efectivo, terminales y propinas.", defaultLimitTime: "02:00", evidenceType: "VIDEO" },
            { title: "Cierre - Embolsado de Corte", description: "Etiquetar sobres con desglose completo y firma.", defaultLimitTime: "02:00", evidenceType: "PHOTO" },
            { title: "Cierre - Verificación Anomalías", description: "Reportar diferencias, errores o billetes falsos.", defaultLimitTime: "02:00", evidenceType: "PHOTO" },
            { title: "Cierre - Entrega de Cortes", description: "Entregar cortes firmados y listos para control.", defaultLimitTime: "02:00", evidenceType: "VIDEO" },
            { title: "Cierre - Depósito en Caja Fuerte", description: "Resguardar corte y sobres en la caja fuerte.", defaultLimitTime: "02:00", evidenceType: "VIDEO" }
        ]
    },
    {
        name: "Plantilla DJ - Eventos y Fin de Semana",
        description: "Checklist operativo para DJ: Montaje, Pruebas de Audio/Iluminación, y Cierre. Activo Jueves, Viernes y Sábados.",
        category: "Entretenimiento",
        tasks: [
            { title: "Antes del Evento - Limpieza Profunda de Cabina", description: "Limpiar mesas, muebles, estructuras y equipos periféricos.", defaultLimitTime: "19:00", evidenceType: "VIDEO", days: ["Thu", "Fri", "Sat"] },
            { title: "Antes del Evento - Retirar Desechos", description: "Retirar vasos, latas y restos de alimentos de la cabina.", defaultLimitTime: "19:00", evidenceType: "VIDEO", days: ["Thu", "Fri", "Sat"] },
            { title: "Antes del Evento - Ruta y Sujeción de Cables", description: "Cables fijos con sujetadores/cinta. Evitar desorden en piso.", defaultLimitTime: "19:00", evidenceType: "VIDEO", days: ["Thu", "Fri", "Sat"] },
            { title: "Antes del Evento - Verificación de Conexiones", description: "Confirmar conexiones seguras, sin cables sueltos.", defaultLimitTime: "19:00", evidenceType: "VIDEO", days: ["Thu", "Fri", "Sat"] },
            { title: "Antes del Evento - Prueba de Iluminación", description: "Encender y probar lámparas, cabezas móviles, LED, estrobos.", defaultLimitTime: "19:00", evidenceType: "VIDEO", days: ["Thu", "Fri", "Sat"] },
            { title: "Antes del Evento - Alineación de Iluminación", description: "Alinear equipos según diseño del evento.", defaultLimitTime: "19:00", evidenceType: "VIDEO", days: ["Thu", "Fri", "Sat"] },
            { title: "Antes del Evento - Corrección Fallas Iluminación", description: "Reportar y corregir desperfectos antes del inicio.", defaultLimitTime: "19:00", evidenceType: "PHOTO", days: ["Thu", "Fri", "Sat"] },
            { title: "Antes del Evento - Verificación de Bocinas", description: "Confirmar sonido claro, fuerte y sin interferencias.", defaultLimitTime: "19:00", evidenceType: "VIDEO", days: ["Thu", "Fri", "Sat"] },
            { title: "Antes del Evento - Garantía Funcionamiento Audio", description: "Corregir cualquier desperfecto de audio antes del servicio.", defaultLimitTime: "19:00", evidenceType: "VIDEO", days: ["Thu", "Fri", "Sat"] },
            { title: "Después del Evento - Apagado y Desconexión", description: "Apagar audio, luces, consolas, micrófonos. Desconectar si aplica.", defaultLimitTime: "02:00", evidenceType: "VIDEO", days: ["Thu", "Fri", "Sat"] },
            { title: "Después del Evento - Limpieza Superficies", description: "Limpiar equipos con paño seco/microfibra (sin líquidos dañinos).", defaultLimitTime: "02:00", evidenceType: "VIDEO", days: ["Thu", "Fri", "Sat"] },
            { title: "Después del Evento - Retiro Residuos", description: "Retirar toda la basura y dejar cabina limpia.", defaultLimitTime: "02:00", evidenceType: "VIDEO", days: ["Thu", "Fri", "Sat"] },
            { title: "Después del Evento - Verificación Final", description: "Cabina ordenada, limpia y equipo resguardado.", defaultLimitTime: "02:00", evidenceType: "VIDEO", days: ["Thu", "Fri", "Sat"] }
        ]
    },
    {
        name: "Plantilla Salón - Montaje y Limpieza",
        description: "Checklist operativo para Salón y Baños: Montaje previo, Limpieza profunda y Cierre. Incluye tecnología y exteriores.",
        category: "Salón",
        tasks: [
            { title: "Montaje - Exteriores y Entrada", description: "Barrer calle, limpiar frente. Colocar lámparas, encender anuncios. Área recepción limpia.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Montaje - Mobiliario Salón", description: "Mesas y bancos limpios (Fabuloso), bien colocados. Cartas limpias.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Montaje - Pisos y Detalles", description: "Piso trapeado (cloro/desengrasante). Sin basura en esquinas. Ventiladores/Lámparas limpios.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Montaje - Tecnología", description: "Internet, Comanderas, Pantallas, Bocinas, Iluminación funcionando al 100%.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Montaje - Letrero LED", description: "Colocar y asegurar letrero LED con promoción visible. Conectar a luz.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Montaje - Baños Listos", description: "WC, lavamanos, mingitorios impecables. Piso tallado. Papel, jabón y sanitas repuestos.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Mitad de Turno - Limpieza Salón", description: "Barrer/trapear pasillos. Limpiar mesas/sillas. Vaciar botes basura. Orden general.", defaultLimitTime: "20:00", evidenceType: "VIDEO" },
            { title: "Mitad de Turno - Limpieza Baños", description: "Repasar limpieza lavabos/WC. Trapear piso. Reponer insumos. Vaciar basura.", defaultLimitTime: "20:00", evidenceType: "VIDEO" },
            { title: "Cierre - Salón Completo", description: "Limpieza profunda: barrer, trapear, desinfectar mesas/sillas. Cartas ordenadas. Basura fuera.", defaultLimitTime: "02:00", evidenceType: "VIDEO" },
            { title: "Cierre - Baños Profundo", description: "Tallar y desinfectar WC, mingitorios, lavabos (sin sarro). Piso y paredes limpios. Basura fuera.", defaultLimitTime: "02:00", evidenceType: "VIDEO" },
            { title: "Cierre - Tecnología y Apagado", description: "Apagar pantallas, PC, bocinas (NO DVR). Limpiar equipos. Cables ordenados.", defaultLimitTime: "02:00", evidenceType: "VIDEO" }
        ]
    },
    {
        name: "Plantilla de Cocina - Operación Completa",
        description: "Checklist integral para la operación diaria de cocina: Apertura, Mitad de Turno y Cierre. Incluye limpieza, producción y mantenimiento.",
        category: "Cocina",
        tasks: [
            { title: "Apertura - Producción Completa y Preparación", description: "Preparar ingredientes (picar, cortar, pelar), precocer, elaborar salsas y bases. Verificar mise en place completo. Uso obligatorio de cofia.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Apertura - Mantenimiento y Cambio de Aceite", description: "Limpieza profunda o cambio de aceite. Verificar nivel, temperatura y estado (sin residuos). Tener coladores listos.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Apertura - Bandejas Limpias y Disponibles", description: "Asegurar que todas las bandejas estén limpias, secas y en su lugar.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Verificación de Refrigeradores", description: "Comprobar temperatura adecuada de todos los refrigeradores.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Producción Refrigerada", description: "Confirmar que toda la producción esté almacenada en refrigeración y a temperatura correcta.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Empaquetado Correcto", description: "Asegurar productos bien empaquetados, sellados y rotulados para evitar contaminación.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Revisión de Porcionado", description: "Verificar porcionado exacto según estándar.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Orden y Rotación (FIFO)", description: "Organizar productos por PEPS (Primeras Entradas, Primeras Salidas).", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Limpieza de Parrillas y Planchas", description: "Verificar encendido, temperatura y limpieza de rejillas y utensilios.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Limpieza de Salseras y Loza", description: "Salseras, mamilas y platos 100% limpios y secos.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Limpieza Profunda de Cocina", description: "Desinfectar superficies, mesas, campanas y eliminar residuos/grasa.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Apertura - Revisión de Gas", description: "Verificar nivel de tanque, presión y ausencia de fugas.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Mitad de Turno - Limpieza de Superficies", description: "Lavar y desinfectar mesas de trabajo durante el turno.", defaultLimitTime: "20:00", evidenceType: "PHOTO" },
            { title: "Mitad de Turno - Limpieza Equipos Cocción", description: "Limpieza rápida de parrillas, planchas y freidoras (remover exceso de grasa/restos).", defaultLimitTime: "20:00", evidenceType: "PHOTO" },
            { title: "Mitad de Turno - Lavado Utensilios", description: "Lavar y acomodar utensilios y equipos menores acumulados.", defaultLimitTime: "20:00", evidenceType: "PHOTO" },
            { title: "Mitad de Turno - Limpieza Pisos", description: "Barrer y trapear con desengrasante para evitar accidentes.", defaultLimitTime: "20:00", evidenceType: "VIDEO" },
            { title: "Mitad de Turno - Gestión Basura", description: "Vaciar botes, cambiar bolsas y limpiar área de basura.", defaultLimitTime: "20:00", evidenceType: "PHOTO" },
            { title: "Mitad de Turno - Verificación General", description: "Revisión final para continuar servicio sin pendientes visibles.", defaultLimitTime: "20:00", evidenceType: "PHOTO" },
            { title: "Cierre - Limpieza Total Superficies", description: "Lavar y desinfectar a fondo todas las mesas y áreas de trabajo.", defaultLimitTime: "02:00", evidenceType: "VIDEO" },
            { title: "Cierre - Limpieza Profunda Equipos", description: "Limpieza final de parrillas, planchas, freidoras. Sin grasa acumulada.", defaultLimitTime: "02:00", evidenceType: "VIDEO" },
            { title: "Cierre - Lavado Total Utensilios", description: "Todos los utensilios lavados, secos y guardados en su lugar.", defaultLimitTime: "02:00", evidenceType: "PHOTO" },
            { title: "Cierre - Limpieza Profunda Pisos", description: "Tallado, barrido y trapeado profundo con desengrasante.", defaultLimitTime: "02:00", evidenceType: "VIDEO" },
            { title: "Cierre - Basura y Orden Final", description: "Retirar toda la basura, limpiar botes. Cocina totalmente ordenada.", defaultLimitTime: "02:00", evidenceType: "PHOTO" },
            { title: "Cierre - Revisión Campanas y Filtros", description: "Verificar y limpiar filtros de campana si hay grasa acumulada.", defaultLimitTime: "02:00", evidenceType: "PHOTO" }
        ]
    },
    {
        name: "Plantilla Gerente - Supervisión General",
        description: "Checklist de supervisión gerencial: Apertura, Medio Turno y Cierre de todas las áreas (Salón, Cocina, Barra, Caja).",
        category: "Gerencia",
        tasks: [
            { title: "Apertura - Llegada Puntual", description: "Llegar a tiempo según horario. Sin retardos.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Apertura - Revisión de Uniforme", description: "Uniforme completo, limpio y buena presentación personal.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Apertura - Certificación Salón", description: "Verificar limpieza, montaje y ambientación del salón.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Certificación Cocina", description: "Verificar equipos, limpieza, mise en place y personal listo.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Certificación Barra", description: "Verificar limpieza, stock, equipos y preparación de barra.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Certificación Caja", description: "Verificar sistema, fondo, insumos y cajero listo.", defaultLimitTime: "14:00", evidenceType: "PHOTO" },
            { title: "Apertura - Reporte Hora Apertura", description: "Reportar hora exacta de apertura con evidencia visual del local.", defaultLimitTime: "14:00", evidenceType: "VIDEO" },
            { title: "Mitad de Turno - Certificación Salón", description: "Verificar mantenimiento de limpieza y orden durante servicio.", defaultLimitTime: "20:00", evidenceType: "PHOTO" },
            { title: "Mitad de Turno - Certificación Cocina", description: "Verificar orden, limpieza y flujo de trabajo en cocina.", defaultLimitTime: "20:00", evidenceType: "PHOTO" },
            { title: "Mitad de Turno - Certificación Barra", description: "Verificar limpieza y reabastecimiento en barra.", defaultLimitTime: "20:00", evidenceType: "PHOTO" },
            { title: "Mitad de Turno - Certificación Caja", description: "Verificar orden y funcionamiento en caja.", defaultLimitTime: "20:00", evidenceType: "PHOTO" },
            { title: "Cierre - Certificación Salón", description: "Salón limpio a fondo, sillas sobre mesas (si aplica), sin basura.", defaultLimitTime: "02:00", evidenceType: "VIDEO" },
            { title: "Cierre - Certificación Cocina", description: "Cocina impecable, equipos apagados, insumos guardados.", defaultLimitTime: "02:00", evidenceType: "VIDEO" },
            { title: "Cierre - Certificación Barra", description: "Barra limpia, sin insumos expuestos, equipos apagados.", defaultLimitTime: "02:00", evidenceType: "VIDEO" },
            { title: "Cierre - Certificación Caja", description: "Caja cerrada, corte realizado, equipos apagados.", defaultLimitTime: "02:00", evidenceType: "VIDEO" },
            { title: "Cierre - Certificación DJ", description: "Cabina limpia, equipos apagados, cables ordenados.", defaultLimitTime: "02:00", evidenceType: "VIDEO" },
            { title: "Cierre - Reporte Hora Cierre", description: "Reportar hora exacta de cierre con local totalmente recogido.", defaultLimitTime: "02:00", evidenceType: "VIDEO" }
        ]
    }
];

async function main() {
    try {
        console.log("🌱 Seeding all 7 process templates...");
        for (const tData of templatesData) {
            const existing = await prisma.processTemplate.findFirst({
                where: { name: tData.name }
            });
            if (existing) {
                console.log(`⚠️ Template "${tData.name}" already exists. Skipping.`);
                continue;
            }

            const createdTemplate = await prisma.processTemplate.create({
                data: {
                    name: tData.name,
                    description: tData.description,
                    category: tData.category
                }
            });
            console.log(`✅ Created Template: "${tData.name}" (ID: ${createdTemplate.id})`);

            for (const task of tData.tasks) {
                await prisma.processTemplateTask.create({
                    data: {
                        templateId: createdTemplate.id,
                        title: task.title,
                        description: task.description,
                        defaultLimitTime: task.defaultLimitTime,
                        evidenceType: task.evidenceType,
                        isRequired: true,
                        days: task.days || []
                    }
                });
            }
            console.log(`   - Created ${tData.tasks.length} tasks for "${tData.name}"`);
        }
        console.log("✨ All process templates seeded successfully!");
    } catch (error) {
        console.error("❌ Error seeding templates:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
