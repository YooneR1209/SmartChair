# Pruebas-readme

<div align="center">
  
# 🎓 UNL SmartChair 
</div>

### Plataforma integral para gestión de congresos académicos 📚

<div align="center">
<img src="https://readme-typing-svg.herokuapp.com?font=mono&size=20&duration=4000&color=F97316&center=true&vCenter=true&lines=Transformando+la+gestión+académica;Sistema+moderno+para+congresos;Más+simple+que+EasyChair+🚀" height="80px">
</div>

<div align="center">
<img src="https://github.com/diegoih23/Pruebas-readme/blob/main/images/minecraft.gif" width="500">
</div>

<p align="center">
<a href="#"><img src="https://img.shields.io/badge/Estado-En desarrollo-orange?style=for-the-badge"></a>
<a href="#"><img src="https://img.shields.io/badge/Plataforma-Web-blue?style=for-the-badge"></a>
<a href="#"><img src="https://img.shields.io/badge/Universidad-UNL-green?style=for-the-badge"></a>
</p>

---

# 📍 Atajos del README

| TEMA                   | DESCRIPCIÓN                          | ATAJO                         |
| ---------------------- | ------------------------------------ | ----------------------------- |
| 💻 **Descripción**     | Qué es el sistema                    | [Ver](#-descripción)          |
| 🎯 **Objetivo**        | Propósito del proyecto               | [Ver](#-objetivo-del-sistema) |
| 🏗️ **Arquitectura**    | Diseño del sistema                   | [Ver](#️-arquitectura-del-sistema) |
| 🧰 **Tecnologías**     | Stack tecnológico                    | [Ver](#-tecnologías)          |
| ⚙️ **Características** | Funcionalidades principales          | [Ver](#-características)      |
| 💳 **Pagos**           | Sistema de tickets y pagos           | [Ver](#-sistema-de-pagos)     |
| 🧠 **Módulos**         | Estructura del sistema               | [Ver](#-módulos-del-sistema)  |
| 👥 **Roles**           | Actores del sistema                  | [Ver](#-roles-del-sistema)    |
| 🌿 **Git Flow**        | Flujo de trabajo del repositorio     | [Ver](#-flujo-de-trabajo-git-flow) |

---
# 💻 Descripción

La **UNL SmartChair** es una plataforma web diseñada para modernizar la gestión de eventos académicos en la Universidad Nacional de Loja.

Centraliza procesos clave como:

* 📅 Gestión de congresos
* 📄 Envío y revisión de artículos científicos
* 💳 Gestión de pagos e inscripciones
* 📜 Generación automática de certificados

👉 Inspirado en EasyChair, pero enfocado en:

* Mejor experiencia de usuario 😌  
* Interfaz moderna 🎨  
* Adaptación a pagos locales 💳  

---

# 🎯 Objetivo del sistema

Desarrollar una plataforma digital institucional que permita:

* Gestionar eventos académicos de forma centralizada
* Automatizar procesos administrativos
* Facilitar la revisión de artículos científicos
* Integrar pagos y certificaciones en un solo sistema

👉 Todo esto en una solución **escalable, modular y adaptable a futuras necesidades institucionales**.

---

# 🏗️ Arquitectura del sistema

El sistema sigue una arquitectura **cliente-servidor** basada en API REST.

### 🔹 Estructura general

<img src="https://github.com/YooneR1209/SmartChair/blob/main/images/ChatGPT%20Image%2016%20abr%202026%2C%2019_53_59.png" alt="GIF" width="500" height="700"></p>
### 🔹 Características de la arquitectura

* Separación clara entre frontend y backend
* Comunicación mediante JSON
* Diseño modular y escalable
* Preparado para futuras integraciones:
  * 📱 Apps móviles
  * 🏫 Sistemas institucionales
  * 💳 Pasarelas de pago

---

# 🧰 Tecnologías

## 🔙 Backend

* 🐍 **Python**
* 🌐 **Django**
* 🔌 **Django REST Framework**
* 🗄️ **MariaDB**
* ⚙️ ORM de Django

### Ventajas:

* Seguridad integrada (auth, permisos, roles)
* Desarrollo rápido y mantenible
* Escalabilidad para sistemas institucionales

---

## 🎨 Frontend

* ⚛️ **React**
* 🌐 Consumo de API REST
* 🎯 Interfaces modernas e interactivas

---

## 🔧 DevOps y herramientas

* 🐙 Git + GitHub
* 🌿 Git Flow
* 📦 Control de versiones
* 🧪 Entornos de desarrollo separados

---

# ⚙️ Características

* 📄 **Gestión de papers**

  * Envío de artículos (PDF/DOCX)
  * Revisión por pares (doble ciego)
  * Evaluación académica

* 📊 **Dashboard**

  * Estadísticas en tiempo real
  * Control de eventos
  * Gestión centralizada

* 🏫 **Multi-evento**

  * Soporte para múltiples congresos
  * Organización por facultades

* 📜 **Certificados automáticos**

  * Generación en PDF
  * Validación con QR

---

# 💳 Sistema de pagos

* 🎟️ Compra de tickets por evento
* 💰 Métodos adaptados:

  * Transferencias bancarias
  * Pagos con QR

* 📤 Subida de comprobantes
* 🔍 Validación manual

### Estados de pago:

* Pendiente
* En verificación
* Aprobado
* Rechazado

---

# 🧠 Módulos del sistema

* 🔐 Autenticación y roles
* 📅 Gestión de eventos
* 📄 Envío de trabajos
* 🧑‍⚖️ Revisión por pares
* 💳 Pagos
* 📜 Certificación
* 🔔 Notificaciones

---

# 👥 Roles del sistema

### 👨‍🎓 Autor
* Envía artículos
* Consulta estado

### 🧑‍🏫 Revisor
* Evalúa trabajos
* Emite comentarios

### 🧑‍💼 Organizador
* Administra eventos
* Asigna revisores
* Valida pagos

### 👨‍💻 Administrador
* Control total del sistema
* Gestión de usuarios y configuración

---

# 🌿 Flujo de trabajo: Git Flow

Se utiliza la metodología **Git Flow** para mantener un desarrollo organizado:

### 🔹 Ramas principales

* `main` → versión estable (producción)
* `develop` → integración de desarrollo

### 🔹 Ramas de soporte

* `feature/*` → nuevas funcionalidades
* `release/*` → preparación de versiones
* `hotfix/*` → corrección de errores críticos

👉 Beneficios:

* Trabajo colaborativo ordenado
* Integración controlada
* Menor riesgo en producción

---

# 🚀 Estado del proyecto

🔧 Actualmente en desarrollo  
📌 En fase de construcción de módulos base  
📈 Escalable a nuevas funcionalidades  

---
### ⭐ Si te interesa este proyecto, ¡apóyalo con una estrella!

<div align="center">
<img src="https://i.pinimg.com/originals/35/60/21/356021c99fded9d442b02d0b48891338.gif" height="30px">
</div>


----
### 🌟 DESARROLLADORES
<p align="center">
  <a href="https://github.com/marco-cst">
    <img src="https://github.com/YooneR1209/SmartChair/blob/main/images/166523628.png" width="60" height="60" style="border-radius:50%;">
  </a>
  
  <a href="https://github.com/diegoih23">
    <img src="https://github.com/YooneR1209/SmartChair/blob/main/images/218983922.jpg" width="60" height="60" style="border-radius:50%;">
  </a>
  
  <a href="https://github.com/YooneR1209">
    <img src="https://github.com/YooneR1209/SmartChair/blob/main/images/166523269.jpg" width="60" height="60" style="border-radius:50%;">
  </a>
  
  <a href="https://github.com/WagnerBalcazar">
    <img src="https://github.com/YooneR1209/SmartChair/blob/main/images/166561281.jpg" width="60" height="60" style="border-radius:50%;">
  </a>

  <a href="https://github.com/ArisCorBet">
    <img src="https://github.com/diegoih23/Pruebas-readme/blob/main/170268833.png" width="60" height="60" style="border-radius:50%;">
  </a>
</p>
