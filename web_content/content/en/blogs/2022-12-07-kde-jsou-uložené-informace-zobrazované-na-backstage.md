---
author: Tomáš Peroutka
title: Kde jsou uložené informace zobrazované na Backstage?
description: Přehled uložení uživatelských informací viditelných na Backstage portálu.
tags:
  - Backstage
date: 2022-11-30T13:09:08.339Z
thumbnail: /pictures/spotify-labs-header.png
---
Hlavním zdrojem informací pro Backstage je Git (BitBucket, GitHub, ... ). Informace jsou v Gitu uloženy a spravovány stejně jako zdrojové kódy aplikací. Jedná se např. o popis IT služeb, jejich dokumentaci, specifikaci API, používané zdroje (databáze, fronty, ...) nebo architektonická rozhodnutí.\
Každá položka je popsána yaml souborem se stejnou skrukturou a logikou používanou v Kubernetu. Příklad definice služby (kind: Component, spec.type: service):

```
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: consents-consentor
  description: Collects interactions from customer-facing services in other domains. The entry point into the Consents domain.
  tags:
    - streaming-collector
  annotations:
    lmc/narwhal-artifact: consents-consentor-
spec:
  type: service
  lifecycle: deprecated
  owner: architecture
  system: consents-consentsManager
  dependsOn:
    - resource:consents-interactionCollectorStream
  providesApis:
    - consents-consentor_rest
```

Tyto soubory, typicky pojmenované `catalog-info.yaml`, mohou být uložený kdekoli. Backstage si je najde - jenom ji musíme říct kde, takže určitá míra předvídatelnosti se hodí pro vytvoření jednoduchých pravidel.\
Stejnou strukturu mají všechny informace uložené pro Backstage v Gitu, liší se tím, o jaký kind jde - máme např. Technology, System, Domain, Resource, Deployment Artefact. Část z nich je přímo součástí core modelu Backstage, ale některé jsme si přidali pro lepší zachycení informací. Ty nám pomohou s orientací technologickým landscapem Alma Career Central.V příštím příspěvku se detailněji podíváme na nejdůležitější položku katalogu - Componentu typu Service.