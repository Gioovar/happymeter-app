# Guía de Configuración de Notificaciones (SMS y WhatsApp)

Para habilitar las notificaciones por SMS y WhatsApp en HappyMeter, necesitas configurar las credenciales de Twilio y Meta (Facebook Developers) en tu archivo `.env`.

## 1. Configuración de SMS (Twilio)

Twilio es el proveedor utilizado para enviar mensajes de texto (SMS).

### Pasos:
1.  **Crear Cuenta**: Regístrate en [Twilio](https://www.twilio.com/).
2.  **Obtener Número**: En tu consola, compra un número de teléfono con capacidad de SMS.
3.  **Obtener Credenciales**:
    *   Ve al [Dashboard de la Consola](https://console.twilio.com/).
    *   Copia el **Account SID**.
    *   Copia el **Auth Token**.
4.  **Actualizar `.env`**:
    Agrega estas líneas a tu archivo `.env` en la raíz del proyecto:

    ```bash
    # Twilio (SMS)
    TWILIO_ACCOUNT_SID="tu_account_sid_aqui"
    TWILIO_AUTH_TOKEN="tu_auth_token_aqui"
    TWILIO_PHONE_NUMBER="+1234567890" # El número que compraste en Twilio
    ```

## 2. Configuración de WhatsApp (Meta / Facebook Developers)

Para WhatsApp, utilizamos la API de WhatsApp Business Cloud alojada por Meta.

### Pasos:
1.  **Crear App**: Ve a [Meta for Developers](https://developers.facebook.com/) > Mis Apps > Crear App > Otro > Negocios.
2.  **Agregar WhatsApp**: En el dashboard de tu app, busca "WhatsApp" y haz clic en "Configurar".
3.  **Obtener Token y ID**:
    *   En el menú lateral izquierdo, ve a **WhatsApp > Configuración de la API**.
    *   Copia el **Identificador de número de teléfono** (Phone Number ID).
    *   Genera un **Token de acceso de usuario del sistema** (permanente) o usa el token temporal para pruebas (24h).
        *   *Nota: Para producción, debes crear un Usuario del Sistema en el Business Manager y asignarle permisos.*
4.  **Actualizar `.env`**:
    Agrega estas líneas a tu archivo `.env`:

    ```bash
    # Meta (WhatsApp)
    WHATSAPP_API_TOKEN="tu_token_de_acceso_aqui"
    WHATSAPP_PHONE_ID="tu_phone_number_id_aqui"
    ```

## 3. Verificación

Una vez configuradas las variables, reinicia tu servidor de desarrollo (`npm run dev`) y prueba el script de verificación nuevamente:

```bash
npx tsx scripts/verify-env.ts
```

Si todo está correcto, verás mensajes en verde confirmando la configuración.
