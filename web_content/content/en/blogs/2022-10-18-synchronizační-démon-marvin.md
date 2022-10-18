---
author: Michal Šrámek
title: Synchronizační démon "Marvin"
description: "\"I've been talking to Narwhal. It hates me.\" --Marvin"
tags:
  - python
  - AD
date: 2022-10-18T13:49:56.338Z
thumbnail: /pictures/marvin-adsyncer.jpg
---
* samostatná Python3 aplikace, s Narwhalem komunikuje přes uživatelské API (má účet s právem `USER_MANAGEMENT`)
* aplikace synchronizuje členy AD skupiny `CN=Narwhal-users,OU=Narwhal,OU=LMC User Groups,DC=ad,DC=lmc,DC=cz` s databází Narwhala:

  * blokuje účty, které nemají protějšek v AD
  * přidává chybějící účty s defaultním nastavením:

    * rozpozná roli **leader** / **developer** / **developer ve zkušebce** a podle toho nastaví capabilities
    * zařadí do defaultní skupiny dle AD skupin `SWD-*` - mapování na projektové skupiny má přímo v sobě v dictionary (aby se dalo snadno programátorsky upravit)
  * u existujících účtů zkontroluje, jestli nechybí nějaké automaticky přidělované členství / práva (dle předchozího bodu) a upozorní na to v graylogu
  * synchronizace se týká zatím jen účtů typu **person**, výhledově i **machine**, nikdy speciálních narwhalích typů
* AD skupina `CN=Narwhal-users,OU=Narwhal,OU=LMC User Groups,DC=ad,DC=lmc,DC=cz` obsahuje všechny SWD teamy a dále uživatele, kteří nepatří do žádného SWD teamu, ale přesto potřebují přístup do Narwhala
* aplikace nebude:

  * mazat uživatele
  * odebírat práva a členství ve skupinách (nebude přepisovat ruční změny)
  * vytvářet certifikáty pro API

# S﻿hrnutí

* nový vývojář dostane automaticky účet se základní příslušností ke skupině a základními právy
* uživatel s ručně přidanými **právy** / **členstvím** ve skupině o tato práva / členství nepřijde
* při přestupu uživatele mezi týmy bude potřeba ručně zrušit členství v původní skupině
* při odchodu vývojáře se účet automaticky zamkne