---
author: Tomáš Peroutka
title: Jak Backstage  pomůže při integraci s externí službou?
description: Popis situace, ve které vývojář potřebuje integoravat svoji
  aplikaci na API externí služby.
tags:
  - backstage
date: 2023-01-06T08:02:34.278Z
thumbnail: /pictures/backstage-header.png
---
## Připojení externí služby může být komplikované

Dnešní aplikace se skládají z velkého množství vzájemně integrovaných služeb. To přináší mnoho výhod, ale také problémů. Pro vývojáře je občas složité najít dostatečný popis služby, na kterou se jeho aplikace má integrovat. 

Zvláštním případem je potom nutnost napojit se na službu externí, kterou vyvíjí úplně jiný tým. Dohledání nutných informací o službě a jejím API bývá časově náročné, specifikace jsou často v nesourodých formátech a neaktualizované. Dochází proto k prodloužení vývoje a výsledná kvalita je v ohrožení.

## Informace o externích službách na jednom místě usnadní řešení problému

Těmto problémům se lze vyhnout, pokud existuje jedno místo s popisem všech externích služeb. Popis dodává vlastník služby, která poskytuje jiným aplikacím svoje API. Konzumentem informací je vývojář, jehož úkolem je připojit tuto externí službu do své aplikace.

Vlastník externí služby musí popsat alespoň:

1. Základní informace nutné k dohledání služby
2. Očekávané chování služby
3. S﻿pecifikaci API (ve standardním formátu jako např. OpenAPI)
4. Seznam veřejně dostupných instancí a jejich účel

Pro integraci s externí službou potřebuje vývojář:

1. Najít popis externí služby, resp. jejího API
2. Vyvinout integraci se službou
3. Deklarovat použití API u záznamu pro Backstage katalog

Backstage umožňuje vlastníkovi služby popsat vše potřebné. Vývojář integrace může jednoduše vyhledat potřebné informace a použít je.

Dále se podíváme na jednotlivé části popisu detailněji.

## Co popisuje vývojář externí služby?

### Základní informace nutné k dohledání služby

Rozumné minimum informací je popsáno v předchozím příspěvku [Jak se v Backstage popíše služba](https://engineering-blog.service.prod-internal.consul/blogs/2022-12-07-jak-se-v-backstage-pop%C3%AD%C5%A1e-slu%C5%BEba/). Takový záznam je dohledatelný pomocí fulltextu, filtrací seznamu služeb nebo procházením struktury servisního katalogu (služba má přiřazeného vlastníka, patří do systému apod.). 

Zde je vidět popis služby `consents-reconciliatorAPI`, kterou budeme v tomto příspěvku používat jako ukázku:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: consents-reconciliatorAPI
  description: Provides a batch API for searching consents by email or phone.
spec:
  type: service
  lifecycle: production
  owner: architecture
  system: consents-personManager
  dependsOn:
    - component:consents-fstatorCache
```

### Očekávané chování služby

Součástí popisu by mělo být očekávané chování služby. Jedná se především o její dostupnost, supportovatelnost či limity výkonu. Tyto informace jsou v Backstage součástí dokumentace služby.

### API ve standardním formátu

Pro popis rozhraní používá Backstage zavedené standardy OpenAPI, AsynAPI, GraphQL nebo GRPC. Popis API samotného je tedy zcela nezávislý na Backstage.

Pokud již vývojář externí službý má popis v jednom z podporovaných standardů, stačí ho pouze přidat k popisu služby v Backstage připojit. Pokud není k dispozici, může ho vyrobit buď ručně, nebo použije jakýkoli nástroj pro generování specifikace z kódu.

API v Backstage je samostatný typ entity (kind=API) reprezentovaný vlastním souborem `catalog_info.yaml`

```yaml
apiVersion: backstage.io/v1alpha1
kind: API
metadata:
  name: consents-reconciliatorAPI_rest
  description: Domain API for batch constents reconciliation. 
spec:
  type: openapi
  lifecycle: production
  owner: architecture
  system: consents-personManager
  definition:
    $text: ./consents-reconciliatorAPI_rest_v1_0_0.yaml
```

Většina atributů má stejný význam jako při popisu jiných entit. Důležitý atribut pro API specifikaci je `definition.$text` . Ten informuje Backstage o umístění standardního popisu API (v našem příkladě to je soubor `consents-reconciliatorAPI_rest_v1_0_0.yaml` ve stejném adresáři jako soubor `catalog_info.yaml`). Oddělení manifestu pro katalog Bacstage od specifikace API samotného umožňuje použít jakéhokoli nástroje pro tvorbu OpenAPI a jiných specifikací.

Posledním krokem při specifikaci API poskytovaného službou je úprava souboru `catalog_info.yaml` služby samotné. Zde je nově vytvořené API zařazeno do seznamu poskytovaných rozhraní (`providedApis`):

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: consents-reconciliatorAPI
  description: Provides a batch API for searching consents by email or phone.
spec:
  type: service
  lifecycle: production
  owner: architecture
  system: consents-personManager
  dependsOn:
    - component:consents-fstatorCache
  providesApis:
    - consents-reconciliatorAPI_rest
```

### Seznam veřejně dostupných instancí a jejich účel

Vlastník služby musí také specifikovat instance, na které se je možné napojit. Klíčové jsou dvě informace:

1. Adresa instance
2. Účel využití instanc

Adresa umožňuje směrovat provoz na konkrétní instanci (je to např. URL pro REST API, název Kafka topicu pro asynchronní komunikaci apod.). 

Je také nutné definovat, k čemu je možné danou instanci používat. Mezi běžné účely patří vývoj, testování, pilot nebo produkce. Tyto účely jsou popsány vždy z pohledu klientské služby - tzn. instance pro účely vývoje slouží pro jiné služby při jejich vývoji (vývojová verze poskytované externí služby v seznamu vůbec nemá být uvedena).

Např. pro OpenAPI je seznam instancí a jejich účelů možné definovat přímo ve specifikaci API:

```yaml
...
servers:
  - url: http://consents-reconciliatorapi-common-stable.service.dev1-services.consul/
    description: Development
  - url: http://consents-reconciliatorapi-common-stable.service.deploy-services.consul/
    description: Testing
  - url: http://consents-reconciliatorapi-common-stable.service.prod-services.consul/
    description: Production
...
```

## Co potřebuje udělat vývojář integrace?

### Najít popis externí služby, resp. jejího API

Pro nalezení externí služby může vývojář použít tyto části Backstage především API explorer, případně obecnější fulltext search nebo katalog a jeho relace. Ukázka API exploreru s filtrem pro API z domény `consents`:

![](/pictures/jak_backstag_pomuze_pri_integraci-api_catalog.jpg)

### Vyvinout integraci se službou

Při vývoji služby poslouží Backstage jako reference pro dokumentaci API. Každé API má stabilní adresu, kterou je proto možné uložit nebo sdílet s ostatními. Backstage dále umožňuje přidat každou položku katalogu do seznamu oblíbených. 

Rychlý přístup k často používaným API specifikacím zrychluje orientaci v případě řešení problémů. Příklad filtrace pro API favourites:

![](/pictures/jak_backstag_pomuze_pri_integraci-favourites.jpg)

### Deklarovat použití API u záznamu pro Backstage katalog

Jakmile je integrace vyvinuta, je nutné doplnit tuto skutečnost do specifikace služby. V Backstage je možné u každé služby definovat seznam API, která služba konzumuje. Vznikne tak cenná informace pro poskytovatele služby - bude si vědom, kdo a proč na jeho službě závisí.  V `catalog_info.yaml` souboru se jedná o položku `consumedAPIs`:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: consents-reconciliatorAPI
  description: Provides a batch API for searching consents by email or phone.
spec:
  type: service
  lifecycle: production
  owner: architecture
  system: consents-personManager
  dependsOn:
    - component:consents-fstatorCache
  providesApis:
    - consents-reconciliatorAPI_rest
  consumedApis:
    - consents-personIdentification_rest
```