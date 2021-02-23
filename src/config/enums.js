// TODO: Only submit integers to backend

/**
 * Configuration of Enums
 */

export const typeOptions = [
  {
    text: "Aanvullend onderzoek",
    type: "warning"
  },
  {
    text: "Monitoring",
    color: "white"
  },
  {
    text: "Notitie",
    color: "light"
  },
  {
    text: "Quickscan",
    color: "light"
  },
  {
    text: "Onbekend",
    color: "dark"
  },
  {
    text: "Sloopgrens onderzoek",
    color: "primary"
  },
  {
    text: "Second opinion",
    color: "secondary"
  },
  {
    text: "Archief onderzoek",
    color: "primary"
  },
  {
    text: "Bouwkundig onderzoek",
    color: "primary"
  },
  {
    text: "Funderingsadvies",
    color: "secondary"
  },
  {
    text: "Inspectieput",
    color: "secondary"
  },
  {
    text: "Funderings onderzoek",
    color: "primary"
  },
  {
    text: "Grondwater onderzoek",
    color: "primary"
  }
];

export const statusOptions = [
  {
    text: "Todo",
    label: "Nog te beoordelen",
    bgColor: "#3D5372"
  },
  {
    text: "Pending",
    label: "In bewerking",
    bgColor: "#F5A623"
  },
  {
    text: "Done",
    label: "Afgerond",
    bgColor: "#28CC8B"
  },
  {
    text: "Discarded",
    label: "Afgevallen",
    bgColor: "#3D5372"
  },
  {
    text: "PendingReview",
    label: "Gecontroleerd",
    bgColor: "#7a56e8" //'#3D5372'
  },
  {
    text: "Rejected",
    label: "Afgekeurd",
    bgColor: "#FF4E4E"
  }
];

export const accessOptions = [
  {
    value: "Public",
    label: "Openbaar"
  },
  {
    value: "Private",
    label: "Gesloten"
  }
];

// TODO Hardcoded, enums didn't map
export const foundationTypeOptions = [
  {
    //value: 'Wood',
    value: 0,
    text: "Hout"
  },
  {
    //value: 'WoodAmsterdam',
    value: 1,
    text: "Hout: Amsterdam fundering"
  },
  {
    //value: 'WoodRotterdam',
    value: 2,
    text: "Hout: Rotterdam fundering"
  },
  {
    //value: 'Concrete',
    value: 3,
    text: "Beton"
  },
  {
    //value: 'NoPile',
    value: 4,
    text: "Niet onderheid"
  },
  {
    //value: 'NoPileMasonry',
    value: 5,
    text: "Niet onderheid: gemetseld"
  },
  {
    //value: 'NoPileStrips',
    value: 6,
    text: "Niet onderheid: stroken fundering"
  },
  {
    //value: 'NoPileBearingFloor',
    value: 7,
    text: "Niet onderheid: fundering met dragen vloer"
  },
  {
    //value: 'NoPileConcreteFloor',
    value: 8,
    text: "Niet onderheid: dragende betonvloer"
  },
  {
    //value: 'NoPileSlit',
    value: 9,
    text: "Niet onderheid: slieten"
  },
  {
    //value: 'WoodCharger',
    value: 10,
    text: "Hout met oplanger"
  },
  {
    //value: 'WeightedPile',
    value: 11,
    text: "Verzwaardepuntpaal"
  },
  {
    //value: 'Combined',
    value: 12,
    text: "Gecombineerd"
  },
  {
    //value: 'SteelPile',
    value: 13,
    text: "Stalen buispalen"
  },
  {
    //value: 'Other',
    value: 14,
    text: "Overig"
  }
  // value 15 removed due to deprecation
];

// If foundationType is a type of no-pile
export function isNoPile(value) {
  return [4, 5, 6, 7, 8, 9].includes(value);
}

// if foundationType is a type of wood
export function isWood(value) {
  return [0, 1, 2, 3, 10].includes(value);
}

// if foundationType is a type of wood
export function isWoodCharger(value) {
  return value === 10;
}

// TODO Hardcoded, enums didn't map
export const foundationQualityOptions = [
  {
    //value: 'Bad',
    value: 0,
    text: "Slecht"
  },
  {
    //value: 'Mediocre',
    value: 1,
    text: "Matig"
  },
  {
    //value: 'Tolerable',
    value: 2,
    text: "Redelijk"
  },
  {
    //value: 'Good',
    value: 3,
    text: "Goed"
  },
  {
    //value: 'MediocreGood',
    value: 4,
    text: "Matig tot goed"
  },
  {
    //value: 'MediocreBad',
    value: 5,
    text: "Matig tot slecht"
  }
];

// TODO Hardcoded, enums didn't map
export const substructureOptions = [
  {
    //value: 'Cellar',
    value: 0,
    text: "Kelder"
  },
  {
    //value: 'Basement',
    value: 1,
    text: "Souterrain"
  },
  {
    //value: 'Crawlspace',
    value: 2,
    text: "Kruipkelder"
  },
  {
    //value: 'None',
    value: 3,
    text: "Geen"
  }
];

export const damageCharacteristicsOptions = [
  {
    // value: 'JammingDoorWindow'
    value: 0,
    text: "Klemmende ramen en/of deuren"
  },
  {
    // value: 'Crack'
    value: 1,
    text: "Scheur(en) in de muur en/of gevels"
  },
  {
    // value: 'Skewed'
    value: 2,
    text: "De woning staat wat scheef"
  },
  {
    // value: 'CrawlspaceFlooding'
    value: 3,
    text: "Hoog water in de kruipruimte"
  },
  {
    // value: 'ThresholdAboveSubsurface'
    value: 4,
    text: "De woning light hoger dan trottoir/weg"
  },
  {
    // value: 'ThresholdBelowSubsurface'
    value: 5,
    text: "De woning ligt lager dan trottoir/weg"
  },
  {
    // value: 'CrookedFloorWall'
    value: 6,
    text: "Scheve vloeren/muren in de woning"
  }
];

export const woodEncroachement = [
  {
    //value: 'Fungusinfection',
    value: 0,
    text: "Schimmel"
  },
  {
    //value: 'BioInfection',
    value: 2,
    text: "Bacterie"
  },
  {
    //value: 'BioFungusInfection',
    value: 1,
    text: "Bacterie en schimmel"
  }
];

export const crackType = [
  {
    //value: 'VerySmall',
    value: 0,
    text: "Zeer klein"
  },
  {
    //value: 'Small',
    value: 1,
    text: "Klein"
  },
  {
    //value: 'Mediocre',
    value: 2,
    text: "Middel"
  },
  {
    //value: 'Large',
    value: 3,
    text: "Groot"
  }
];

export const quality = [
  {
    //value: 'Nil',
    value: 0,
    text: "Nil"
  },
  {
    //value: 'Small',
    value: 1,
    text: "Laag"
  },
  {
    //value: 'Mediocre',
    value: 2,
    text: "Middel"
  },
  {
    //value: 'Large',
    value: 3,
    text: "Hoog"
  }
];

export const carryingCapacityQuality = [
  {
    //value: 'Area 1',
    value: 0,
    text: "1"
  },
  {
    //value: 'Area 2',
    value: 1,
    text: "2"
  },
  {
    //value: 'Area 3',
    value: 2,
    text: "3"
  },
  {
    //value: 'Area 4',
    value: 3,
    text: "4"
  }
];

export const constructionPile = [
  {
    //value: 'Punched',
    value: 0,
    text: "Doorgedrukt"
  },
  {
    //value: 'Broken',
    value: 1,
    text: "Gebroken"
  },
  {
    //value: 'Pinched',
    value: 2,
    text: "Ingedrukt"
  },
  {
    //value: 'Pressed',
    value: 3,
    text: "Samengedrukt"
  },
  {
    //value: 'Perished',
    value: 4,
    text: "Vergaan"
  },
  {
    //value: 'Decay',
    value: 5,
    text: "Verrot"
  },
  {
    //value: 'RootGrowth',
    value: 6,
    text: "Wortelgroei"
  }
];

export const woodType = [
  {
    value: 0,
    text: "Vuren"
  },
  {
    value: 1,
    text: "Grenen"
  }
];

// TODO Hardcoded, enums didn't map
export const damageCauseOptions = [
  {
    //value: 'Drainage',
    value: 0,
    text: "Bemaling"
  },
  {
    //value: 'ConstructionFlaw',
    value: 1,
    text: "Constructieve fouten"
  },
  {
    //value: 'Drystand',
    value: 2,
    text: "Droogstand (schimmels)"
  },
  {
    //value: 'Overcharge',
    value: 3,
    text: "Overbelasting"
  },
  {
    //value: 'OverchargeNegativeCling',
    value: 4,
    text: "Overbelasting (negatieve kleef)"
  },
  {
    //value: 'NegativeCling',
    value: 5,
    text: "Negatieve kleef"
  },
  {
    //value: 'BioInfection',
    value: 6,
    text: "Bacterie aantasting"
  },
  /// 7 removed due to deprecation
  {
    //value: 'FungusInfection',
    value: 8,
    text: "Schimmel aantasting"
  },
  {
    //value: 'BioFungusInfection',
    value: 9,
    text: "Bacterie en schimmels aantasting"
  },
  {
    //value: 'foundationFlaw',
    value: 10,
    text: "Funderings fouten"
  },
  {
    //value: 'constructionHeave',
    value: 11,
    text: "Afglijden fundering"
  },
  {
    //value: 'subsidence',
    value: 12,
    text: "Bodemdaling"
  },
  {
    //value: 'vegetation',
    value: 13,
    text: "Aantasting (planten)wortels"
  },
  {
    //value: 'gas',
    value: 14,
    text: "Gaswinning"
  },
  {
    //value: 'vibrations',
    value: 15,
    text: "Trillingen"
  },
  {
    //value: 'partial_foundation_recovery',
    value: 16,
    text: "Funderingsherstel naastgelegen pand"
  }
];

// TODO Hardcoded, enums didn't map
export const enforcementTermOptions = [
  {
    text: "0-5 jaar",
    //value: 'Term0_5'
    value: 0
  },
  {
    text: "5-10 jaar",
    //value: 'Term5_10'
    value: 1
  },
  {
    text: "10-20 jaar",
    //value: 'Term10_20'
    value: 2
  },
  {
    text: "5 jaar",
    //value: 'Term5'
    value: 3
  },
  {
    text: "10 jaar",
    //value: 'Term10'
    value: 4
  },
  {
    text: "15 jaar",
    //value: 'Term15'
    value: 5
  },
  {
    text: "20 jaar",
    //value: 'Term20'
    value: 6
  },
  {
    text: "25 jaar",
    //value: 'Term25'
    value: 7
  },
  {
    text: "30 jaar",
    //value: 'Term30'
    value: 8
  },
  {
    text: "40 jaar",
    //value: 'Term40'
    value: 9
  }
];

// TODO Hardcoded, enums didn't map
export const BaseMeasurementLevelOptions = [
  {
    // value: 'NAP',
    value: 0,
    text: "NAP (Nederland)"
  },
  {
    // value: 'TAW',
    value: 1,
    text: "TAW (België)"
  },
  {
    // value: 'NN',
    value: 2,
    text: "NN (Duitsland)"
  }
];

export const FoundationRecoveryEvidenceTypeOptions = [
  {
    value: "Permit",
    text: "Vergunning"
  },
  {
    value: "FoundationReport",
    text: "Funderingsonderzoek"
  },
  {
    value: "ArchiveReport",
    text: "Archiefonderzoek"
  },
  {
    value: "OwnerEvidence",
    text: "Bewijs Eigenaar"
  }
];

export const FoundationRecoveryType = [
  {
    value: "Table",
    text: "Hersteld met tafelconstructie"
  },
  {
    value: "BeamOnPile",
    text: "Hersteld met randbalken op nieuwe palen"
  },
  {
    value: "PileLowering",
    text: "Paalkopverlaging"
  },
  {
    value: "PileInWall",
    text: "Hersteld met uit muren gedrukte palen"
  },
  {
    value: "Injection",
    text: "Verstevigen van de ondergrond door een injectie met kunsthars"
  },
  {
    value: "Unknown",
    text: "Onbekend"
  }
];
