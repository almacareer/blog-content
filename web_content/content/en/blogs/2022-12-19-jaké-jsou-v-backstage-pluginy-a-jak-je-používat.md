---
author: Tomáš Peroutka
title: Jaké jsou v Backstage pluginy a jak je používat?
description: Představení možných pluginů do Backstage, jejich získání a použití.
tags:
  - backstage
date: 2022-12-19T09:41:46.423Z
thumbnail: /pictures/backstage-header.png
---
## Jaké jsou v Backstage pluginy?

Informace prezentované na Backstage se dělí do dvou kategorií:

* **data přímo v interní databázi Backstage** - strukturovaný popis služeb, systémů, domén, zdrojů, API (tvoří tzv. servisní katalog). Zdrojem jsou primárně `catalog_info.yaml` soubory uložené a manuálně spravované v Gitu ([více zde](https://engineering-blog.service.prod-internal.consul/blogs/2022-12-07-kde-jsou-ulo%C5%BEen%C3%A9-informace-zobrazovan%C3%A9-na-backstage/)). 
* **informace dostupné v externích systémech** - kontextové informace navázané na základní strukturu servisního katalogu, které ale nejsou uloženy v Backstage.

Které informace z externích systémů jsou v Backstage k dispozici?
Pluginy pocházejí ze tři zdrojů:

1. Volně dostupné pluginy
2. Komerčně dostupné pluginy 
3. Pluginy vyvinuté přímo na míru našemu prostředí

Na stránce https://backstage.io/plugins je seznam všech oficiálně dostupných pluginů pro Backstage. Tyto pluginy zpřístupňují širokou paletu informací z CI/CD nástrojů, security nástrojů, issue trackingu, infrastruktury, cloudových služeb, monitoringu, code repository (především GitHubu) a dalších. Pluginy nabízejí také vylepšení standardního chování Backstage, jako např. grafické zobrazení závislostí servisního katalogu, práci s kolekcemi služeb nebo . V neposlední řadě jsou k dispozici pluginy rozšiřující datový model Backstage o další informace jako je např. scorecard plugin nebo Technology Radar.

Komerčně dostupné pluginy jsou v ekosystému okolo Backstage novinkou. Pionýrem je zde Spotify, tvůrce Backstage. Sadu licencovnaných pluginů byla představena teprve 15.12.2022. Zatím se nabídka skládá z pěti pluginů nabízených formou předplatného. V budoucnu budou tímto předplatným pokryty i nové pluginy. Aktuálně není známo, jaká bude konečná cena předplatného. Popis pluginů najdete https://backstage.spotify.com/plugins/.

V Backstage chceme mít kompletní informace ze všech systémů a aplikací relevatních pro naše služby. Ne ve všech případech je k dispozici plugin pro okamžité použití. Pro tyto případy je možné Backstage rozšířit pluginy vyvinutými na míru. Na tyto situace je Backstage architektonicky připravena tvorba vlatních pluginů je přímo doporučována a proto je vývoj pluginy relativně jednoduchá záležitost. Nejlepším příkladem takového pluginu v našem prostředí je pohled do Narwhala:

![Narwhal Plugin](/pictures/backstage-narwhal-plugin.jpg)

## Jak pluginy použít?

Využití pluginů se skládá ze dvou kroků.

1. Obstarání pluginu (viz. výše - download, zakoupení, vlastní vývoj) - může provést jakýkoli tým
2. Instalace pluginu do Backstage - provádí DeX tým
3. Konfigurace pluginu u konkrétní entity v Backstage (služba, resource, déména, ...) - provádí vlastník entity 

Detailněji se budeme věnovat poslednímu bodu - co a kde je nutno nastavit, aby služba zobrazovala plugin Narwhala s relevatními informacemi a deployment artefaktu.

B﻿ackstage