---
author: Tomáš Peroutka
title: Jak se v Backstage popíše služba?
description: Dozvíte se, co je z pohledu Backstage služba, jak se popíše a které
  další objekty se službou přímo souvisí.
tags:
  - backstage
date: 2022-12-07T14:32:40.799Z
thumbnail: /pictures/backstage-header.png
---
Informační model Backstage je postaven okolo komponent. Komponenta může popisovat např. službu,  webovou aplikaci, knihovnu, ETL process apod. 

**Nejčastější typ komponenty v našem prostředí je služba (Service), proto se na ni podíváme blíže.**

Datový model Backstage s důrazem na službu a její nejbližší okolí vypadá takto:

![Backstage služba a její okolí](/pictures/2022-12-07_15-36-31.jpg "Backstage služba a její okolí")

Služba představuje externe dostupné a explicitně definované chování softwaru. 

Software samotný je představován Deployment Artifactem, který může poskytovat jednu nebo více služeb. Služba pro svoji činnost potřebuje přistupovat ke zdrojům (Resources) jako jsou databázová schémate, adresáře, frotny apod. Může také záviset na jiných službách. 

Rozhraní služeb je explicitne definováno jako API, které mohou služby buď poskytovat nebo konzumovat. Kolekce služeb, API a zdrojů tvoří systém (System).

Zde je popis jedné ze služeb tak, jak je uložen v Gitu:

![Hlavni vztahy služby v Backstage](/pictures/backstage-service-relations-git.jpg "Hlavni vztahy služby v Backstage")

Zelenou barvou je označena dvojice atributů, které určují službu - kind: Component a type: service. Neboli služba je typ komponenty (další typy si představíme později).
Informace o závislostech služby jsou zvýrazněny červeně. 

Všimněte si, že odkazované závislosti jsou specifikovány pouze obecně, bez informace o tom, na jakém prostředí se daný resource nebo jiná služba nachází. To výrazně usnadňuje tvorbu a udržování popisného souboru a zajišťuje jeho stabilitu. Informace o konkrétních instancích v prostředích jsou v Backstage k dispozici pomocí pluginů, které se integrují do infrastruktury a poskytují detailní informace potřebné pro úplný přehled o službě.

Příště si ukážeme, jak pro službu nadefinovat, které pluginy a jaké informace externích systémů chceme mít k dispozici.