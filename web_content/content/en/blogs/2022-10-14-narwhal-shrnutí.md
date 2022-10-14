---
author: Michal Šrámek
title: Narwhal - Shrnutí
description: Základní informace o architektuře, konfiguraci a provozu Narwhala v Alma Career
tags:
  - narwhal
  - python
  - ansible
date: 2022-10-14T12:48:51.567Z
thumbnail: /web_content/static/pictures/narwhal-docs.png
---
# Intro

Narwhal se skládá ze tří nezávislých částí (a několika pomocných robotů), které se deployují do vlastních kontejnerů a komunikují výhradně přes REST API. Roboti běží na stroji **`dcnarwhalservices-1.dev.internal.lmc`.**

<span style="color:blue">some *blue* text</span>.

* <span style="color:red">**Serval**</span>

  * wrapper kolem Ansiblu - pouští playbook a log posílá do Narwhala
  * API je určené jen pro komunikaci s Narwhalem
* <span style="color:red">**Narwhal**</span>

  * databáze všeho
  * logika přístupových práv, zámků, exportů, ...
  * API určené pro uživatele (s příslušným certifikátem), Web, roboty (Jenkins, ...) a malá část i pro Servala
  * ﻿[Narwhal - API,](https://confluence.lmc.cz/display/TECH/Narwhal+-+API) [Narwhal - API filtry](https://confluence.lmc.cz/display/TECH/Narwhal+-+API+filtry)
* <span style="color:red">**Web**</span>

  * grafické rozhraní, neobsahuje logiku, jen zobrazuje / agreguje data získaná přes API z Narwhala
  * [Narwhal GUI - Release workflow](https://confluence.lmc.cz/display/TECH/Narwhal+GUI+-+Release+workflow)
* <span style="color:orange">﻿**Marvin**</span>

  * robot pro synchronizaci uživatelů: [Synchronizační démon "Marvin"](https://confluence.lmc.cz/pages/viewpage.action?pageId=49886456)
  * další info v sekci User management
* <span style="color:orange">﻿**Wall-e**</span>

  * robot kontrolující prostředí a runtimy proti Consulu
  * nová prostředí automaticky registruje do Narwhala
  * runtimy, které zmizely ze všech prostředí, hlásí do Slacku, kanál #narwhal-monitoring (mj. tam hlásí i jednotlivá zmizení runtimu z prostředí)
* <span style="color:orange">﻿**Bender**</span>

  * renderovací nástroj na templaty pro artefakty typu `service`, `kv_store` a `nomad`
  * [Renderovací nástroj Bender](https://confluence.lmc.cz/pages/viewpage.action?pageId=66224526)
* <span style="color:orange">﻿**Kafka-slack**</span>

  * bezejmenný robot, který čte topic narwhal z Kafky, zpracovává zprávy a posílá je do Slacku, jednak do #narwhal-events, jednak dle definice v kódu (dle předpisu <https://confluence.int.lmc.cz/pages/viewpage.action?pageId=66986723>)