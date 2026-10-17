-- Datos de muestra de Explorar. Requiere haber aplicado 002_rutinas_publicas.sql.
-- Selecciona automáticamente un profesor activo, ordenando por id.
-- Todas las muestras quedan asociadas al gimnasio de ese profesor.
-- Puede ejecutarse varias veces: omite las muestras ya creadas para ese profesor.
-- Conserva las modificaciones realizadas posteriormente desde la app.

BEGIN;

DO $seed$
DECLARE
    v_profesor public.profiles%ROWTYPE;
    v_rutina jsonb;
    v_ejercicio jsonb;
    v_posicion integer;
    v_rutina_id uuid;
    v_creadas integer := 0;
    v_omitidas integer := 0;
BEGIN
    SELECT * INTO v_profesor
    FROM public.profiles
    WHERE rol = 'profesor' AND activo = true AND gimnasio_id IS NOT NULL
    ORDER BY id
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No hay profesores activos para asociar las rutinas de muestra.';
    END IF;

    FOR v_rutina IN SELECT value FROM jsonb_array_elements($rutinas$
[
  {
    "slug": "tenis-base",
    "titulo": "Tenis: movilidad y estabilidad",
    "disciplina": "tenis",
    "nivel": "principiante",
    "grupos_musculares": [
      "piernas",
      "hombros",
      "core"
    ],
    "objetivo": "Explorar ejercicios de movilidad, equilibrio y control corporal para tenis.",
    "equipamiento": "Colchoneta y espacio libre",
    "descripcion": "Rutina de muestra para Explorar. Ejemplo de sesión con movimientos controlados y sin máquinas.",
    "ejercicios": [
      {
        "tipo": "libre",
        "nombre": "Rotaciones torácicas en cuadrupedia",
        "series": 2,
        "repeticiones": "8 por lado",
        "peso_sugerido": "Peso corporal",
        "descripcion": "Girar el tronco de forma controlada, manteniendo las caderas estables."
      },
      {
        "tipo": "libre",
        "nombre": "Sentadilla a una silla",
        "series": 3,
        "repeticiones": "10",
        "peso_sugerido": "Peso corporal",
        "descripcion": "Sentarse y levantarse de forma controlada."
      },
      {
        "tipo": "libre",
        "nombre": "Equilibrio sobre una pierna",
        "series": 3,
        "repeticiones": "20 segundos por lado",
        "peso_sugerido": "Peso corporal",
        "descripcion": "Mantener el equilibrio cerca de un apoyo."
      },
      {
        "tipo": "libre",
        "nombre": "Dead bug",
        "series": 3,
        "repeticiones": "8 por lado",
        "peso_sugerido": "Peso corporal",
        "descripcion": "Alternar brazo y pierna contrarios sin arquear la espalda."
      }
    ]
  },
  {
    "slug": "futbol-control",
    "titulo": "Fútbol: fuerza y control de piernas",
    "disciplina": "futbol",
    "nivel": "intermedio",
    "grupos_musculares": [
      "piernas",
      "core"
    ],
    "objetivo": "Mostrar un entrenamiento complementario de piernas y estabilidad para fútbol.",
    "equipamiento": "Colchoneta y espacio libre",
    "descripcion": "Rutina de muestra para Explorar. Ejemplo de trabajo unilateral y estabilidad, sin depender de equipamiento de sala.",
    "ejercicios": [
      {
        "tipo": "libre",
        "nombre": "Zancadas hacia atrás",
        "series": 3,
        "repeticiones": "8 por lado",
        "peso_sugerido": "Peso corporal",
        "descripcion": ""
      },
      {
        "tipo": "libre",
        "nombre": "Puente de glúteo a una pierna",
        "series": 3,
        "repeticiones": "10 por lado",
        "peso_sugerido": "Peso corporal",
        "descripcion": ""
      },
      {
        "tipo": "libre",
        "nombre": "Elevaciones de talón",
        "series": 3,
        "repeticiones": "15",
        "peso_sugerido": "Peso corporal",
        "descripcion": ""
      },
      {
        "tipo": "libre",
        "nombre": "Plancha lateral",
        "series": 3,
        "repeticiones": "20 segundos por lado",
        "peso_sugerido": "Peso corporal",
        "descripcion": ""
      }
    ]
  },
  {
    "slug": "musculacion-inicio",
    "titulo": "Musculación: primeros pasos sin máquinas",
    "disciplina": "musculacion",
    "nivel": "principiante",
    "grupos_musculares": [
      "pecho",
      "piernas",
      "core"
    ],
    "objetivo": "Conocer patrones básicos de fuerza con el peso corporal.",
    "equipamiento": "Silla estable, pared y colchoneta",
    "descripcion": "Rutina de muestra para Explorar. Ejemplo sencillo para probar la vista de ejercicios y la opción de peso corporal.",
    "ejercicios": [
      {
        "tipo": "libre",
        "nombre": "Sentadilla a una silla",
        "series": 3,
        "repeticiones": "10",
        "peso_sugerido": "Peso corporal",
        "descripcion": ""
      },
      {
        "tipo": "libre",
        "nombre": "Flexiones en pared",
        "series": 3,
        "repeticiones": "10",
        "peso_sugerido": "Peso corporal",
        "descripcion": ""
      },
      {
        "tipo": "libre",
        "nombre": "Puente de glúteos",
        "series": 3,
        "repeticiones": "12",
        "peso_sugerido": "Peso corporal",
        "descripcion": ""
      },
      {
        "tipo": "libre",
        "nombre": "Bird dog",
        "series": 3,
        "repeticiones": "8 por lado",
        "peso_sugerido": "Peso corporal",
        "descripcion": ""
      }
    ]
  },
  {
    "slug": "musculacion-mancuernas",
    "titulo": "Musculación: circuito con mancuernas",
    "disciplina": "musculacion",
    "nivel": "intermedio",
    "grupos_musculares": [
      "espalda",
      "hombros",
      "piernas",
      "core"
    ],
    "objetivo": "Explorar un circuito de fuerza con ejercicios libres y cargas numéricas.",
    "equipamiento": "Par de mancuernas, colchoneta y apoyo estable",
    "descripcion": "Rutina de muestra para Explorar. Las cargas ilustran el selector kg/lb. Cada alumno puede adaptarlas en su copia personal.",
    "ejercicios": [
      {
        "tipo": "libre",
        "nombre": "Sentadilla goblet",
        "series": 3,
        "repeticiones": "10",
        "peso_sugerido": "5 kg",
        "descripcion": "Sostener una mancuerna delante del pecho."
      },
      {
        "tipo": "libre",
        "nombre": "Remo con mancuerna y apoyo",
        "series": 3,
        "repeticiones": "10 por lado",
        "peso_sugerido": "5 kg",
        "descripcion": "Apoyar una mano sobre una superficie estable."
      },
      {
        "tipo": "libre",
        "nombre": "Press de hombros con mancuernas",
        "series": 3,
        "repeticiones": "10",
        "peso_sugerido": "5 lb",
        "descripcion": "La carga indicada corresponde a cada mancuerna."
      },
      {
        "tipo": "libre",
        "nombre": "Dead bug",
        "series": 3,
        "repeticiones": "8 por lado",
        "peso_sugerido": "Peso corporal",
        "descripcion": ""
      }
    ]
  },
  {
    "slug": "basquetbol-estabilidad",
    "titulo": "Básquetbol: estabilidad y desplazamientos",
    "disciplina": "basquetbol",
    "nivel": "intermedio",
    "grupos_musculares": [
      "piernas",
      "core"
    ],
    "objetivo": "Mostrar movimientos laterales y ejercicios de estabilidad para básquetbol.",
    "equipamiento": "Colchoneta y espacio libre",
    "descripcion": "Rutina de muestra para Explorar. Ejemplo de desplazamientos controlados y fuerza del tren inferior.",
    "ejercicios": [
      {
        "tipo": "libre",
        "nombre": "Pasos laterales en posición defensiva",
        "series": 3,
        "repeticiones": "10 pasos por lado",
        "peso_sugerido": "Peso corporal",
        "descripcion": ""
      },
      {
        "tipo": "libre",
        "nombre": "Zancadas laterales",
        "series": 3,
        "repeticiones": "8 por lado",
        "peso_sugerido": "Peso corporal",
        "descripcion": ""
      },
      {
        "tipo": "libre",
        "nombre": "Puente de glúteos",
        "series": 3,
        "repeticiones": "12",
        "peso_sugerido": "Peso corporal",
        "descripcion": ""
      },
      {
        "tipo": "libre",
        "nombre": "Plancha con apoyo de antebrazos",
        "series": 3,
        "repeticiones": "25 segundos",
        "peso_sugerido": "Peso corporal",
        "descripcion": ""
      }
    ]
  },
  {
    "slug": "atletismo-core",
    "titulo": "Atletismo: control unilateral y core",
    "disciplina": "atletismo",
    "nivel": "avanzado",
    "grupos_musculares": [
      "piernas",
      "core"
    ],
    "objetivo": "Explorar ejercicios unilaterales y de control del tronco para atletismo.",
    "equipamiento": "Colchoneta y apoyo estable",
    "descripcion": "Rutina de muestra para Explorar. Ejemplo para probar el filtro de nivel avanzado y ejercicios sin carga externa.",
    "ejercicios": [
      {
        "tipo": "libre",
        "nombre": "Peso muerto a una pierna sin carga",
        "series": 3,
        "repeticiones": "10 por lado",
        "peso_sugerido": "Peso corporal",
        "descripcion": ""
      },
      {
        "tipo": "libre",
        "nombre": "Zancada hacia atrás con elevación de rodilla",
        "series": 3,
        "repeticiones": "10 por lado",
        "peso_sugerido": "Peso corporal",
        "descripcion": ""
      },
      {
        "tipo": "libre",
        "nombre": "Elevación de talón a una pierna",
        "series": 3,
        "repeticiones": "12 por lado",
        "peso_sugerido": "Peso corporal",
        "descripcion": ""
      },
      {
        "tipo": "libre",
        "nombre": "Plancha lateral con elevación de pierna",
        "series": 3,
        "repeticiones": "8 por lado",
        "peso_sugerido": "Peso corporal",
        "descripcion": ""
      }
    ]
  }
]
$rutinas$::jsonb)
    LOOP
        INSERT INTO public.rutinas (
            id, titulo, grupos_musculares, alumno_id, gimnasio_id,
            profesor_id, profesor_nombre, activa, creada_por_alumno,
            es_publica, rutina_origen_id, disciplina, nivel,
            objetivo, equipamiento, descripcion
        ) VALUES (
            md5('seed-explorar-v1:' || v_profesor.id::text || ':' || (v_rutina->>'slug'))::uuid,
            v_rutina->>'titulo',
            ARRAY(SELECT jsonb_array_elements_text(v_rutina->'grupos_musculares')),
            NULL, v_profesor.gimnasio_id, v_profesor.id, v_profesor.nombre,
            true, false, true, NULL,
            v_rutina->>'disciplina', v_rutina->>'nivel',
            v_rutina->>'objetivo', v_rutina->>'equipamiento', v_rutina->>'descripcion'
        ) ON CONFLICT (id) DO NOTHING RETURNING id INTO v_rutina_id;

        IF v_rutina_id IS NULL THEN
            v_omitidas := v_omitidas + 1;
            CONTINUE;
        END IF;

        FOR v_ejercicio, v_posicion IN
            SELECT value, ordinality::integer
            FROM jsonb_array_elements(v_rutina->'ejercicios') WITH ORDINALITY
        LOOP
            INSERT INTO public.rutina_ejercicios (
                rutina_id, posicion, tipo, maquina_id, nombre_libre,
                descripcion_libre, series, repeticiones, peso_sugerido
            ) VALUES (
                v_rutina_id, v_posicion, 'libre', NULL,
                v_ejercicio->>'nombre', NULLIF(v_ejercicio->>'descripcion', ''),
                (v_ejercicio->>'series')::integer,
                v_ejercicio->>'repeticiones', v_ejercicio->>'peso_sugerido'
            );
        END LOOP;
        v_creadas := v_creadas + 1;
    END LOOP;

    RAISE NOTICE 'Rutinas creadas: %. Ya existentes: %. Profesor: %. Gimnasio: %.',
        v_creadas, v_omitidas, v_profesor.nombre, v_profesor.gimnasio_id;
END;
$seed$;

COMMIT;
