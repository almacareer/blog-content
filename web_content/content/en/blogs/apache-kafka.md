---
author: "Ondřej Horák"
title: "Zabezpečení Kafky"
description: "Informace o zabezpečení Kafky v LMC"
tags: ["kafka"]
date: 2022-10-11
thumbnail: https://i.iinfo.cz/images/286/apache-kafka-1.jpg
---

# Kafka - Zabezpečení

<aside>
ℹ️ Tento dokument je zatím jen hodně hrubý nástřel, jak by to mohlo vypadat

</aside>

<aside>
⚠️ Máme připravené a funkční řešení zabezpečeného připojení ke Kafce. Je tedy doporučeno připojovat se zabezpečeně.

</aside>

Oficiální dokumentace Kafky: [https://kafka.apache.org/documentation/#security](https://kafka.apache.org/documentation/#security)

Dokumentace na confluent.io: [https://docs.confluent.io/current/security/index.html](https://docs.confluent.io/current/security/index.html)

# Úvod

Tato stránka popisuje **(zatím jen jako návrh)** zabezpečení Kafky a její komunikace s klienty v prostředí LMC.

Zabezpečení má celkem 3 aspekty: šifrování komunikace, autentizaci klientů, autorizaci k operacím s Kafka clusterem a daty. Všechny tyto aspekty je nutné řešit jak pro komunikaci Kafka clusteru s klienty, tak pro vzájemnou komunikaci Kafka brokerů.

Obdobně by mělo být vyřešeno i zabezpečení Zookeepera, na kterém je Kafka závislá, ale s ohledem na obecnou nedostatečnost možností zabezpečení v aktuálně používané verzi Zookeepera (3.4.x)  toto necháme na jiný projekt.

**Šifrování a autentizace** budou řešeny společně přes SSL/TLS s využitím serverových a klientských certifikátů. Certifikáty bude vydávat Vault (podepsané Linca), jejich generování na straně serveru a klientů by mělo být automatizováno (Consul Template). V subjectu klientského certifikátu bude uvedena informace o uživateli (nebo uživatelské roli), na kterou bude navázána autorizace.

**Autorizaci** budeme řešit standardním Kafka ACL pluginem.

# Šifrování a autentizace

Ke generování certifikátů využijeme **Vault PKI engine**.

Kafka by měla dostat **vlastní CA (kafkaca)**. Vytvářet role a certifikáty podepsané touto CA by měl mít omezený počet osob (primárně vlastník Kafky a SYS).

V subjectu certifikátu v OU bude nastaveno jméno role a identifikace Kafka clusteru. Na základě této identifikace budou v Kafce přidělována přístupová práva.

Role budou minimálně následující:

- pro zápis a čtení dat topiců: read, write, rw
- pro administraci: admin
- serverový certifikát a klíč pro komunikaci mezi brokery: server

Pro každou roli a cluster bude ve Vaultu vytvořena PKI role (šablona), která bude vydávat certifikáty s předvyplněnými údaji v subjectu, které odpovídají clusteru a roli.

Formát může být např. (uživatelská role read, Kafka cluster kfsupport, prostředí prod-rad):

- jméno role ve Vaultu: `read_kfsupport_prod-rad`
- OU: `read@kfsupport.prod-rad`.

Žádost o přístup do Kafky by měl vydat tým, který ho potřebuje, po konzultaci s vlastníkem Kafky.

# Vydávání certifikátů

- serverový certifikát na Kafka brokerech by měl být zajištěn přes Consul Template;
- klientský certifikát pro aplikace - TBD
- klientský certifikát pro osoby - zatím zajistí vlastník Kafky, v budoucnu by mělo být vyřešeno nějakým (polo)automatizovaným způsobem

# Autorizace

Standardní Simple ACL plugin neumí pracovat s uživatelskými rolemi, práva se přidělují přímo uživatelům (principalům). V našem případě ale potřebujeme jen několik jednoduchých scénářů, takže by nám mohlo stačit pár uživatelů pojmenovaných podle přístupových rolí.

### Uživatelé a jejich oprávnění:

admin, server - přístup všude, v konfiguraci Kafky nastaveni jako superuser; tito uživatelé jediní mají práva i na změny v clusteru

read - přístup pro čtení všech topiců (tj. všechna práva, která může potřebovat consumer)

write - přístup pro zápis do topiců (všechna práva, která může potřebovat producer)

rw - přístup pro čtení i zápis

anonymous - dočasně povolíme uživateli anonymous (tj. nepřihlášeným uživatelům) stejná práva, jako má uživatel admin; tím umožníme klientům, kteří se připojují postaru, aby mohli plynule přejít (přepnutím na SSL a jiný port Kafky)

### Další nastavení

Jako superuser bude v konfiguraci nastaven admin. Takto nebude potřeba mu definovat práva přes ACL. Na resources, které nemají nastavené žádné ACL, nebude povolen nikomu (kromě superusera) přístup.

V konfiguraci Kafky jde o tato nastavení:

`super.users=User:admin`

`allow.everyone.if.no.acl.found=false`

# Open points

### Přístup do Vaultu z různých prostředí

Zatím používáme jeden společný Vault v prostředí prod-internal, do něj ale není přístup z devX/devel prostředí. Toto by mělo být vyřešeno nějakým univerzálním způsobem, možná vytvořením kafkaca ve všech Vaultech na všech prostředích (nebo aspoň na devX/devel). Je otázkou, zda má mít kafkaca na všech prostředích stejný klíč, nebo by v každém byl jiný.

### Vytvoření rolí pro CA kafkaca

Základní role (viz výše) by se ideálně měly vytvářet automaticky, např. při vytvoření Kafka nodů, případně spolu s vytvořením serverových certifikátů (které bez příslušné role stejně nelze vydat).

### Vydávání certifikátů

**Serverové certifikáty:** Předpokládám, že vydávání serverových certifikátů by měl zajistit SYS přes Consul Template. Serverové certifikáty by měly mít velký TTL, ať se nemusí příliš často měnit.

**Klientské certifikáty pro aplikace:** Ideálně by mělo být opět řešeno přes Consul Template na klientských strojích. Konkrétní PKI roli (typicky jednu z rolí read/write/rw), pro kterou bude vygenerován certifikát, by měl určit tým, který přístup požaduje (tech lead nebo obecně nějaký leader týmu). I tyto certifikáty by měly mít velký TTL.

**Klientské certifikáty pro osoby:** Zatím bude vydávat vlastník Kafky na žádost leadera týmu. TTL bude nižší.

### Obměna certifikátů

Certifikáty a klíče se načítají při startu serveru/klienta.

Prováděl bych obměnu natolik často, aby byla dostatečná šance, že server/klient bude restartován s novými certifikáty dříve, než doběhne TTL.