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

# Deployment

(jen pro hlavní části Narwhala, deployment robotů je popsaný v sekci Provoz)

## Build

* <span style="color:red">verze image se bere z příslušného souboru VERSION v projektu - před každým buildem je nutné ji ručně změnit!</span>
* provádí se na dockerovaném Jenkinsu: 

  \- SSH: dcnarwhal-61.prod.internal.lmc\

  * JENKINS: <http://narwhal.prod.internal.lmc:8080/>\
  * WEB UI: [http://narwhal.prod.internal.lmc/](http://narwhal.prod.internal.lmc:8080/)
  * DCREG: <https://dcreg.service.consul/repository/prod/deployment-narwhal-jenkins>
* Jenkins je ad hoc upravený base image Jenkinsu z docker hubu
* Build nove image je provaden z git repository, kde jsou uvedene i instrukce v README.md: <ssh://git@bitbucket.lmc.cz:7999/nrw/nrw-jenkins.git>

## Deployment

* provádí se pomocí Ansible, nastavení se verzuje v Gitu
* je potřeba, aby Ansible používal na SSH přístup někoho, kdo má na Narwhalích strojích `sudo` (nastavit v souboru **`narwhal-hosts`,** stejně jako případný **přesun** na jiné stroje (pak je potřeba hosts změnit ještě v **`conf/narwhal.yml`))**
* repozitář:[ https://bitbucket.lmc.cz/projects/TECH/repos/narwhal-deployment/browse](https://bitbucket.lmc.cz/projects/TECH/repos/narwhal-deployment/browse)
* příkaz: `ansible-playbook narwhal-<type>.yml -v`, **`type`** může být `dev, pilot, prod, sandbox`

## Konfigurace

* základní konfigurace, která se obvykle nemění, je staticky v souboru **`_narwhal-instance.yml`** - rozdělené po kontejnerech bez ohledu na cílové prostředí; také se sem dočítá konfigurace závislá na prostředí
* konfigurace závislá na prostředí (zejm. verze image) je v souboru **`config/narwhal.yml`**
* defaultní hodnoty nastavení se dají najít zde: <https://bitbucket.lmc.cz/projects/TECH/repos/narwhal/browse/lmc_config/config_backend.py>

## Hostitelské stroje

**Potřebá struktura:**

```shell
/etc/narwhal/
├── certs
│   ├── narwhal.crt
│   ├── narwhal.key
│   ├── rootCA.pem
│   ├── serval.crt
│   ├── serval.key
│   ├── server.crt
│   ├── server.key
│   ├── web.crt
│   └── web.key
├── conf
│   ├── ad.cfg
│   └── db.cfg
└── ssh
    └── config
```

<span style="color:red">**Vzhledem k obsahu by do celého podstromu měl být velmi omezený přístup (SSH to dokonce vyžaduje)!**</span>

<span style="color:orange">**/etc/narwhal/certs**</span> = certifikáty jednotlivých kontejnerů + certifikát CA (musí se jmenovat takto) + serverový ceritifikát (+klíč) pro HTTPS (společný pro všechny kontejnery, protože je vystavený pro celý hostname)

<span style="color:orange">**/etc/narwhal/conf/db.cfg**</span> = connectionstring do DB: `DB__connection_string=postgresql+psycopg2://nwuser:password@dbnarwhal/narwhal`

<span style="color:orange">**/etc/narwhal/ssh**</span> = ssh certifikáty pro roota do různých prostředí (výhledově by to nemusel být root, stačil by všude známý uživatel se sudo, ale muselo by se sáhnout do playbooků) - **produkční certifikát a klíč by měl být pouze na produkčním stroji!**

<span style="color:orange">**/etc/narwhal/ssh/config**</span> = konfigurační soubor SSH pro kontejner Servala - musí obsahovat odkazy na certifikáty (ne klíče) z `/etc/narwhal/ssh`: