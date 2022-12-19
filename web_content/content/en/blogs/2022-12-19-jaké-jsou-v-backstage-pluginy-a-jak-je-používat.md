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

V Backstage chceme mít kompletní informace ze všech systémů a aplikací relevatních pro naše služby. Ne ve všech případech je k dispozici plugin pro okamžité použití. Pro tyto případy je možné Backstage rozšířit pluginy vyvinutými na míru. Na tyto situace je Backstage architektonicky připravena tvorba vlastních pluginů je přímo doporučována a proto je vývoj pluginy relativně jednoduchá záležitost. Nejlepším příkladem takového pluginu v našem prostředí je pohled do Narwhala:

![Narwhal Plugin](/pictures/backstage-narwhal-plugin.jpg)

## Jak pluginy použít?

Využití pluginů se skládá ze dvou kroků.

1. Obstarání pluginu (viz. výše - download, zakoupení, vlastní vývoj) - může provést jakýkoli tým
2. Instalace pluginu do Backstage - provádí DeX tým
3. Konfigurace pluginu u konkrétní entity v Backstage (služba, resource, doména, ...) - provádí vlastník entity 

Detailněji se budeme věnovat poslednímu bodu - co a kde je nutno nastavit, aby služba zobrazovala plugin Narwhala s relevatními informacemi a deployment artefaktu.

Z﻿de je specifikace služby \`consents-consentor\`, která u které chceme vidět informace z Narwhala pomocí pluginu:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: consents-consentor
  description: Collects interactions from customer-facing services in other domains. The entry point into the Consents domain.
  annotations:
    lmc/narwhal-artifact: consents-consentor-
spec:
  type: service
  lifecycle: deprecated
  owner: architecture
  system: consents-consentsManager
```

P﻿ro konfiguraci vyžadovaných pluginů je klíčová sekce \`annotations\`. Každý z klíčů v této části představuje informaci pro pluginy. Zde konkrétně je to klíč \`lmc/narwhal-artifact\`. Pokud je tento klíč ve specifikaci služby uveden, Backstage zobrazí záložku s pluginem Narwhala a předá mu hodnotu - v tomto případě \`consents-consentor-\`. Hodnota je použita pro filtrování artefaktů, které na pluginu budou zobrazeny (viz. screenshot v předchozí části).

S﻿tejným způsobem mohou být zachyceny informace konfigurující jiné pluginy, např.:

```
  annotations:
    backstage.io/kubernetes-id: consents-personAggregateEventsCollector
    kafka.apache.org/consumer-groups: kfall-dev1-services/consents-personAggregateEventsCollector-common-stable
    backstage.io/techdocs-ref: dir:.
    sonarqube.org/project-key: consents-person-aggregate-events-collector
    backstage.io/adr-location: docs/adrs
    backstage.io/history-location: docs/history
```

A﻿notace zobrazí pluginy s informacemi o: 

* O﻿bjektech v Kubernetu
* K﻿onsumovaných topicích  Kafky
* T﻿echnickou dokumentaci
* N﻿álezy ze SonarQube
* R﻿elavantní architektonická rozhodnutí (ADR)
* Č﻿asovou osu změn služby

V﻿ýběr pluginů a předávaná konfigurace je plně v zodpovědnosti vlastníka služby (či jiné entity).

V﻿yužití anotací jako explicitního mechanismu pro konfiguraci pluginů umožňuje takové nastavení zobrazovaných informací, které vyhovuje konkrétním požadavkům vlastníků služeb. Není nutno globálně definovat, jaké pluginy budou zobrazeny, nebo definovat pravidla pro jejich konfiguraci např. ze jména služby. Vše je explicitní a verzované v Gitu.