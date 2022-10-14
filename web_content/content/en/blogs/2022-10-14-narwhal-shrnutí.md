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

**Potřebná struktura:**

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

<span style="color:orange">**/etc/narwhal/ssh**</span> = ssh certifikáty pro roota do různých prostředí (výhledově by to nemusel být root, stačil by všude známý uživatel se sudo, ale muselo by se sáhnout do playbooků) - <span style="color:red">**produkční certifikát a klíč by měl být pouze na produkčním stroji!**</span>

<span style="color:orange">**/etc/narwhal/ssh/config**</span> = konfigurační soubor SSH pro kontejner Servala - musí obsahovat odkazy na certifikáty (ne klíče) z `/etc/narwhal/ssh`:\
\
**/etc/narwhal/ssh/config:**

```yaml
Host *
  StrictHostKeyChecking no
  IdentityFile /root/.ssh/devx_rsa
  IdentityFile /root/.ssh/deploy_rsa
```

# Provoz

Narwhal, Serval a Web by měly být nasazovány pomocí Ansible playbooku (sekce Deployment), roboti se spouští přímo na místě. V případě problémů, způsobených předchozím pádem některé potřebné služby (Consul) nebo celé sítě, obvykle stačí kontejnery restartovat pomocí `docker restart` na příslušném stroji.

Běžné problémy při provozu: [Troubleshooting Narwhal](https://confluence.lmc.cz/display/TECH/Troubleshooting+Narwhal)

## Startování robotů

### **M﻿arvin:**

```shell
docker run -d --restart=always \
    -v /etc/narwhal/certs:/etc/narwhal/certs:ro \
    -e NARWHAL_API=https://narwhal.prod.internal.lmc:5000 \
    -e CERT_PATH=/etc/narwhal/certs \
    -e LDAP_USER=marvin \
    -e LDAP_PASSWD=<password> \
    -e USE_GRAYLOG=True \
    -e GRAYLOG_SERVER=gray.prod.internal.lmc \
    -e LDAP_SERVER=ldaps://ad.service.consul \
    -e USE_PROMETHEUS=True \
    -e PROMETHEUS_PUSHGATEWAY=pushgateway.prod.lmc \
    --name narwhal-marvin \
    --hostname marvin \
    dcreg.service.consul/prod/narwhal-marvin:<version>
```

### **Bender:**

```shell
docker run -d --restart=always \
    -v /etc/narwhal/certs:/etc/narwhal/certs:ro \
    -e CONFIGSTORE_API=http://config-store.prod.services.lmc/v1 \
    -e NARWHAL_API=https://narwhal.prod.internal.lmc:5000 \
    -e CERT_PATH=/etc/narwhal/certs \
    --name narwhal-bender \
    --hostname bender \
    -p 443:443 \
    dcreg.service.consul/prod/narwhal-bender:<version>
```

### **Wall-e:**

```shell
docker run -d --restart=always \
    -v /etc/narwhal/certs:/etc/narwhal/certs:ro \
    -e NARWHAL_API=https://narwhal.prod.internal.lmc:5000 \
    -e CERT_PATH=/etc/narwhal/certs \
    -e CONSULS=http://consul-1.infra.cprod/v1,http://consul-1.infra.pprod/v1,http://consul-1.infra.cdev/v1 \
    -e USE_PROMETHEUS=True \
    -e PROMETHEUS_PUSHGATEWAY=pushgateway.prod.lmc \
    -e USE_GRAYLOG=True \
    -e GRAYLOG_SERVER=gray.prod.internal.lmc \
    -e SLACK_WEBHOOK=https://slackhook.external-services/services/T02VD54KK/BEVE2QNMS/Iwigw8t1pjHLJ9MtedHLTRkV \
    -e INTERVAL=1800 \
    -e DOCKER_MODE=false \
    --name narwhal-wall-e \
    dcreg.infra.cprod/prod/narwhal-wall-e:<version>
```

### **K﻿afka-slack:**

```shell
docker run -d --restart=always \
    -e WEBHOOK=https://hooks.slack.com/services/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 \
    -e KAFKA_SERVER=kfall-61.prod.services.lmc:9092,kfall-51.prod.services.lmc:9092,kfall-82.prod.services.lmc:9092 \
    --name narwhal-slack \
    --hostname slack \
    dcreg.service.consul/prod/narwhal-slack:<version>
```

### **Narwhal-Jenkins:**

```shell
VER=latest
docker run -d --restart=always \
     -p 8080:8080 \
     -p 50000:50000 \
     -v /var/lib/docker/volumes/jenkins-narwhal-home/_data:/var/jenkins_home:rw \
     -v /var/run/docker.sock:/var/run/docker.sock:ro \
     --name narwhal-jenkins \
     dcreg.service.consul/prod/deployment-narwhal-jenkins:${VER}
```

## Instance Narwhala

### **N﻿arwhalí stroje:**

```shell
dcnarwhalservices-1.dev.internal.lmc    - roboti, jenkins # 2.12. 2021 zmigrovano na produkcni server k narwhalovi kvuli izolaci prod prostredi
dcnarwhal-61.prod.internal.lmc           - produkce
dcnarwhal-81.prod.internal.lmc           - pilot
```

* **prod**

  * přístup do všech prostředí
  * nad ostrou DB `dbnarwhal.prod.internal.lmc`
* **pilot**

  * nesmí instalovat do produkce
  * nad stejnou DB jako prod
* ~~**dev, sandbox**~~ `→ smazáno 14.05.2021`

  * ~~nesmí instalovat do produkce~~
  * ~~vlastní DB "na hraní" `dbnarwhal.dev.internal.lmc`~~

## Konfigurace Marvina a Kafka-slack robota

Mapování AD skupin (AD skupina musí být memberOf narwhal-users!) na narwhalí skupiny je zde: <https://bitbucket.lmc.cz/projects/NRW/repos/nrw-marvin/browse/sync/mapping.py> - při změně je potřeba upravit, commitnout, zbuildit novou verzi a nasadit.

Nastavení přeposílání je pro Kafka-slack uložené zde: <https://bitbucket.lmc.cz/projects/TECH/repos/narwhal/browse/kafka_slack/rules.py>. Je to python dict a je potřeba dodržovat typy, takže když u "slack_channels" je set ({val1, val2, ...}), tak tam musí být i pro jednu hodnotu.

## Security

CA má ve správě security. <span style="color:darkred">**V certifikátu musí být celý chain vč. rootové CA, jinak to nebude fungovat!!!**</span>

## User management

### Uživatelé

#### Běžný vývojář

Běžné uživatele do Narwhala zaregistruje robot Marvin podle AD. Podmínkou je, aby byl dotyčný v některé ze skupin, které Marvin zná; jsou to `narwhal-users` a v ní začleněné skupiny `SWD-*`, `SYS` a některé další. <span style="color:red">**Běžný vývojář by měl být v nějaké skupině `SWD-*`, která je členem `narwhal-users`**</span>**.** Pokud tam není, je chyba na straně AD (např. přejmenovaná skupina, nově založená skupina, něčí kreativní záměr atd.) a Marvin ho do Narwhala nezaregistruje (a pokud už tam je, zablokuje ho).

Nový uživatel dostane defaultní práva podle návodu [Narwhal - user capabilities](https://confluence.lmc.cz/display/TECH/Narwhal+-+user+capabilities) a příslušnost ke skupinám podle mapovací tabulky <https://bitbucket.lmc.cz/projects/NRW/repos/nrw-marvin/browse/sync/mapping.py>. V případě změn v teamech by bylo na místě mapovací tabulku upravit a Marvina upgradovat. <span style="color:red">**Marvin dál na práva ani na členství ve skupinách nesahá, pouze hlásí do Graylogu, kdo má práva, na která podle pravidel nemá nárok, případně komu nějaká práva chybí**</span>(typicky RUN_PROD po zkušebce),<span style="color:red">**jakékoliv další zásahy musí ručně provádět někdo s právem USER_MANAGEMENT**</span> (takových lidí by nemělo být moc, nejvýš 5). ~~Výpis Marvinových kontrol: <https://gray-1.prod.internal.lmc/streams/5a93c05f6ae8cb5ce300904b/search>~~

Zaznamy do graylogu jsou aktualne nefunkcni a pracujeme na naprave. Vypis jednotlivych prav je mozne ziskat z logu kontejneru marvina. 

#### Nevývojář

Uživatelé, kteří nejsou v žádném `SWD-*` teamu a mají mít přístup do Narwhala (manageři, architecture, security, ...) musí být přímo členy `narwhal-users`. Jejich členství ve skupinách a případná speciální oprávnění musí zařídit user manager. <span style="color:red">**Přímé členství v `narwhal-users` NENÍ legitimní řešení případného chaosu v AD kolem `SWD-*` teamů!!!**</span>

#### Stroj

Strojový uživatel se musí vytvořit ručně. Respektujte přitom jmennou konvenci `<jméno služby>-<tým>[-<pořadové číslo>]`, např. `jenkins-jobs-1` nebo `jenkins-prace`.

Příklad:

```shell
curl -ik https://dcnarwhal-2.prod.internal.lmc:5000/user/users --key hyklm.key --cert hyklm.crt -X POST -d '{"name": "jenkins-ict", "capabilities":["WRITE", "RUN"], "type": "machine", "groups": ["ict"]}'
```

### Skupiny

#### Vytváření, editace

Nově je možné skupiny vytvářet a editovat (pouze disable) i v GUI.

#### Členství ve skupinách

Od vytvoření uživtele se jeho členství v narwhalích skupinách nijak nesynchronizuje s AD (což je schválně). Proto je možné snadno udělat skupinu, která vlastní artefakty sdílené dvěma teamy (`shared-jobs_prace`), případně někomu dočasně přidat členství v teamu, kde vypomáhá.

## Kód

### Narwhal

Hlavní logika je v `database.py` (drží session nad DB a konstruuje dotazy) a `narwhal.py` (hlídá zámky, kontroluje práva, wrapuje exceptiony).

Obě třídy mají přetíženou metodu <span style="color:purple">\_\_getattribute\_\_</span>, kvůli generickému řešení CRUD operací nad různými entitami (pokud generické řešení nestačí, je potřeba dopsat konkrétní metodu, která pak dostane přednost).

### Serval

Nedoporučuji sahat jinam, než do `inventory.py`, případně `task.py` - tam se generuje inventory yaml. Ostatní části, zejména ty, kde se spouští Ansible, jsou prastaré a temné, jako by je napsal šílený Arab Abdul Alhazred (klid, napsal je Kamil).

### Web

Kromě generování keypairu neobsahuje žádnou významnou logiku. Možná by stálo za to provést něco s mým hnusným JavaScriptem.