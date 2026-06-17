# StreamBot

Bot de Discord desarrollado en Node.js para detectar cuando un usuario inicia una transmisión y publicar una alerta automática en un canal configurado.

El bot puede detectar dos tipos de transmisiones:

* Streaming externo detectado por presencia, por ejemplo Twitch o YouTube.
* Go Live dentro de Discord en canales de voz.

Cuando detecta que un usuario inicia transmisión, envía un mensaje al canal de alertas con un embed informativo.

## Funcionalidades

* Detecta actividad de streaming externo mediante presencia.
* Detecta Go Live en canales de voz de Discord.
* Envía alerta automática a un canal configurado.
* Publica un embed con información del usuario y la actividad.
* Menciona `@everyone` para avisar a la comunidad.
* Evita repetir alertas mientras el usuario continúa transmitiendo.
* Permite extender el comportamiento para filtrar por rol.

## Stack tecnológico

* Node.js
* discord.js
* dotenv

## Requisitos

* Node.js 18 o superior recomendado.
* Aplicación creada en Discord Developer Portal.
* Bot invitado al servidor.
* Token del bot.
* Canal de alertas configurado.
* Permisos adecuados en el servidor.
* Intents de presencia y estados de voz habilitados.

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
DISCORD_TOKEN=TU_TOKEN_DEL_BOT
ALERT_CHANNEL_ID=ID_CANAL_ALERTAS
```

### Descripción de variables

| Variable           | Obligatoria | Descripción                                            |
| ------------------ | ----------: | ------------------------------------------------------ |
| `DISCORD_TOKEN`    |          Sí | Token del bot generado desde Discord Developer Portal. |
| `ALERT_CHANNEL_ID` |          Sí | Canal donde se enviarán las alertas de streaming.      |

## Permisos requeridos en Discord

El bot necesita permisos para:

* Ver canales.
* Enviar mensajes.
* Leer historial de mensajes.
* Mencionar `@everyone`.
* Ver canales de voz.
* Ver presencia de miembros.
* Ver estados de voz.

En Discord Developer Portal se recomienda habilitar:

* Presence Intent.
* Server Members Intent, si se requiere lectura completa de miembros.

## Instalación

Clonar el repositorio:

```bash
git clone https://github.com/itachi364/StreamBot.git
cd StreamBot
```

Instalar dependencias:

```bash
npm install
```

Crear archivo `.env`:

```bash
cp .env.example .env
```

Si no existe `.env.example`, crear manualmente el archivo `.env`.

Ejecutar el bot:

```bash
npm start
```

## Ejecución en producción con PM2

Instalar PM2:

```bash
npm install -g pm2
```

Iniciar el bot:

```bash
pm2 start npm --name StreamBot -- start
```

Guardar configuración:

```bash
pm2 save
```

Configurar arranque automático:

```bash
pm2 startup
```

Ver logs:

```bash
pm2 logs StreamBot
```

Reiniciar:

```bash
pm2 restart StreamBot
```

## Funcionamiento

El bot escucha eventos de Discord relacionados con presencia y estados de voz.

### Detección de streaming externo

Cuando Discord reporta una actualización de presencia, el bot revisa las actividades del usuario. Si encuentra una actividad de tipo streaming, genera una alerta en el canal configurado.

Este flujo aplica para plataformas externas cuando Discord expone la actividad como streaming.

### Detección de Go Live

Cuando un usuario inicia transmisión dentro de un canal de voz de Discord, el bot detecta el cambio mediante el evento de estado de voz.

Si el usuario empieza Go Live y no se había notificado previamente, el bot envía una alerta al canal configurado.

### Control de duplicados

El bot usa un conjunto en memoria para evitar enviar muchas alertas mientras el usuario sigue transmitiendo.

Cuando el usuario deja de transmitir por voz, se limpia su estado para permitir futuras alertas.

## Mensaje de alerta

El bot envía un mensaje con:

* Mención `@everyone`.
* Nombre del usuario que inició la transmisión.
* Tipo de actividad.
* Canal de voz, si aplica.
* URL del stream, si Discord la proporciona.
* Avatar del usuario.
* Fecha/hora de la alerta.

## Filtro por rol

El código incluye una constante para limitar alertas a usuarios con un rol específico:

```js
const STREAMER_ROLE_ID = null;
```

Por defecto está en `null`, lo que significa que cualquier usuario puede generar alerta al iniciar transmisión.

Para activar filtro por rol, se puede configurar el ID del rol en el código:

```js
const STREAMER_ROLE_ID = 'ID_DEL_ROL';
```

## Limitaciones actuales

* El filtro por rol está definido en código, no en variable de entorno.
* El bot usa memoria local para controlar streams activos.
* Si el bot se reinicia, se pierde el estado de transmisiones activas.
* Las alertas dependen de que Discord entregue correctamente los eventos de presencia o voz.
* Para streams externos, el usuario debe tener su actividad visible en Discord.
* No existe base de datos ni historial de alertas.
* No existe panel administrativo.
* El mensaje usa `@everyone` de forma fija.

## Seguridad

No subas el archivo `.env` al repositorio.

Ejemplo recomendado de `.gitignore`:

```gitignore
node_modules/
.env
npm-debug.log*
```

También se recomienda revisar el uso de `@everyone`, ya que puede generar muchas notificaciones si el servidor tiene alta actividad.

## Estructura general

```text
StreamBot
├── index.js
├── package.json
└── .env
```

## Comandos útiles

Instalar dependencias:

```bash
npm install
```

Ejecutar localmente:

```bash
npm start
```

Ejecutar con PM2:

```bash
pm2 start npm --name StreamBot -- start
```

Ver logs:

```bash
pm2 logs StreamBot
```

Reiniciar:

```bash
pm2 restart StreamBot
```

## Despliegue recomendado en EC2

Este bot puede ejecutarse junto con otros bots Node.js en una misma instancia EC2 usando PM2.

Ejemplo:

```bash
cd ~/discord-bots/StreamBot
npm install
pm2 start npm --name StreamBot -- start
pm2 save
```

## Posibles mejoras futuras

* Mover `STREAMER_ROLE_ID` a variable de entorno.
* Permitir configurar si se menciona `@everyone`, un rol o nadie.
* Agregar soporte para múltiples servidores.
* Persistir historial de transmisiones.
* Evitar alertas repetidas después de reinicios.
* Agregar Dockerfile para despliegue en contenedores.
* Agregar GitHub Actions para validación automática.
* Agregar comandos administrativos para configurar canal y rol desde Discord.

## Licencia

Proyecto de uso personal/comunitario. Ajustar la licencia según las necesidades del repositorio.
