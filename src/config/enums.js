// TODO: Only submit integers to backend

/**
 * Configuration of Enums
 */

export const typeOptions = [
  {
    text: "Aanvullend onderzoek",
    color: "white",
    bgColor: "#3D5372",
  },
  {
    text: "Monitoring",
    color: "white",
    bgColor: "#3D5372",
  },
  {
    text: "Notitie",
    color: "white",
    bgColor: "#3D5372",
  },
  {
    text: "Quickscan",
    color: "white",
    bgColor: "#3D5372",
  },
  {
    text: "Onbekend",
    color: "white",
    bgColor: "#3D5372",
  },
  {
    text: "Sloopgrens onderzoek",
    color: "white",
    bgColor: "#3D5372",
  },
  {
    text: "Second opinion",
    color: "white",
    bgColor: "#3D5372",
  },
  {
    text: "Archief onderzoek",
    color: "white",
    bgColor: "#3D5372",
  },
  {
    text: "Bouwkundig onderzoek",
    color: "white",
    bgColor: "#3D5372",
  },
  {
    text: "Funderingsadvies",
    color: "white",
    bgColor: "#3D5372",
  },
  {
    text: "Inspectieput",
    color: "white",
    bgColor: "#3D5372",
  },
  {
    text: "Funderings onderzoek",
    color: "white",
    bgColor: "#3D5372",
  },
  {
    text: "Grondwater onderzoek",
    color: "white",
    bgColor: "#3D5372",
  },
  {
    text: "Grondonderzoek",
    color: "white",
    bgColor: "#3D5372",
  },
  {
    text: "Gevelscan",
    color: "white",
    bgColor: "#3D5372",
  }
];

export const statusOptions = [
  {
    text: "Todo",
    label: "Nog te beoordelen",
    bgColor: "#3D5372",
  },
  {
    text: "Pending",
    label: "In bewerking",
    bgColor: "#F5A623",
  },
  {
    text: "Done",
    label: "Afgerond",
    bgColor: "#28CC8B",
  },
  {
    text: "Discarded",
    label: "Afgevallen",
    bgColor: "#3D5372",
  },
  {
    text: "PendingReview",
    label: "Gecontroleerd",
    bgColor: "#7a56e8", //'#3D5372'
  },
  {
    text: "Rejected",
    label: "Afgekeurd",
    bgColor: "#FF4E4E",
  },
];

export const accessOptions = [
  {
    value: "Public",
    label: "Openbaar",
  },
  {
    value: "Private",
    label: "Gesloten",
  },
];

export const foundationGroupImages = [
  {
    value: "wood",
    text: "Houten palen",
    icon: "foundation-wooden-poles.svg",
  },
  {
    value: "woodCharger",
    text: "Houten palen oplanger",
    icon: "foundation-wooden-poles-2.svg",
  },
  {
    value: "concrete",
    text: "Betonnen palen",
    icon: "foundation-concrete-poles.svg",
  },
  {
    value: "none",
    text: "Niet onderheid",
    icon: "foundation-none.svg",
  },
];

// TODO Hardcoded, enums didn't map
export const foundationTypeOptions = [
  {
    //value: 'Wood',
    value: 0,
    text: "Hout",
    group: "wood",
  },
  {
    //value: 'WoodAmsterdam',
    value: 1,
    text: "Hout: Amsterdam fundering",
    group: "wood",
  },
  {
    //value: 'WoodRotterdam',
    value: 2,
    text: "Hout: Rotterdam fundering",
    group: "wood",
  },
  {
    //value: 'Concrete',
    value: 3,
    text: "Beton",
    group: "concrete",
  },
  {
    //value: 'NoPile',
    value: 4,
    text: "Niet onderheid",
    group: "none",
  },
  {
    //value: 'NoPileMasonry',
    value: 5,
    text: "Niet onderheid: gemetseld",
    group: "none",
  },
  {
    //value: 'NoPileStrips',
    value: 6,
    text: "Niet onderheid: stroken fundering",
    group: "none",
  },
  {
    //value: 'NoPileBearingFloor',
    value: 7,
    text: "Niet onderheid: fundering met dragen vloer",
    group: "none",
  },
  {
    //value: 'NoPileConcreteFloor',
    value: 8,
    text: "Niet onderheid: dragende betonvloer",
    group: "none",
  },
  {
    //value: 'NoPileSlit',
    value: 9,
    text: "Niet onderheid: slieten",
    group: "none",
  },
  {
    //value: 'WoodCharger',
    value: 10,
    text: "Hout met oplanger",
    group: "woodCharger",
  },
  {
    //value: 'WeightedPile',
    value: 11,
    text: "Verzwaardepuntpaal",
    group: "concrete",
  },
  {
    //value: 'Combined',
    value: 12,
    text: "Gecombineerd",
    group: "wood",
  },
  {
    //value: 'SteelPile',
    value: 13,
    text: "Stalen buispalen",
    group: "concrete",
  },
  {
    //value: 'Other',
    value: 14,
    text: "Overig",
    group: "wood",
  },
  // {
  //   //value: 'Unknown',
  //   value: 15,
  //   text: 'Onbekend'
  // }
];

export const crackAmountOptions = [
  {
    value: 1,
    text: "1",
  },
  // {
  //   value: 2,
  //   text: "2",
  // },
  // {
  //   value: 3,
  //   text: "3",
  // },
  // {
  //   value: 4,
  //   text: "4",
  // },
  // {
  //   value: 5,
  //   text: "5",
  // },
];

export const crackTypeOptions = [
  {
    value: 0,
    text: "Geen",
  },
  {
    value: 1,
    text: "Zeer klein",
  },
  {
    value: 2,
    text: "Klein",
  },
  {
    value: 3,
    text: "Matig",
  },
  {
    value: 4,
    text: "Groot",
  }
];

export const rotationOptions = [
  {
    //value: 'Nihil',
    value: 0,
    text: "Nihil",
  },
  {
    //value: 'Small',
    value: 1,
    text: "Klein",
  },
  {
    //value: 'Mediocre',
    value: 2,
    text: "Middelmatig",
  },
  {
    //value: 'Big',
    value: 3,
    text: "Groot",
  },
  {
    //value: 'VeryBig',
    value: 4,
    text: "Zeer groot",
  }
];

export const sizeOptions = [
  {
    //value: 'Nihil',
    value: 0,
    text: "Nihil",
  },
  {
    //value: 'Small',
    value: 1,
    text: "Klein",
  },
  {
    //value: 'Mediocre',
    value: 2,
    text: "Middelmatig",
  },
  {
    //value: 'Groot',
    value: 3,
    text: "Groot",
  },
];

export const woodEncroachementOptions = [
  {
    //value: fungus_infection
    value: 0,
    text: "Schimmelaantasting",
  },
  {
    //value: bio_fungus_infection
    value: 1,
    text: "Bacteriele-,schimmelaantasting",
  },
  {
    //value: bio_infection
    value: 2,
    text: "Bacteriele aantasting",
  },
]

export const foundationBarOptions = [
  {
    value: "wood",
    text: "Hout",
  },
  {
    value: "concrete",
    text: "Beton",
  },
];

export const qualityOptions = [
  {
    //value: '',
    value: 0,
    text: "Slecht",
  },
  {
    //value: '',
    value: 1,
    text: "Redelijk",
  },
  {
    //value: '',
    value: 2,
    text: "Goed",
  },
  {
    //value: '',
    value: 3,
    text: "Zeer goed",
  },
];

// TODO Hardcoded, enums didn't map
export const foundationQualityOptions = [
  {
    //value: 'Bad',
    value: 0,
    text: "Slecht",
  },
  {
    //value: 'Mediocre',
    value: 1,
    text: "Matig",
  },
  {
    //value: 'Tolerable',
    value: 2,
    text: "Redelijk",
  },
  {
    //value: 'Good',
    value: 3,
    text: "Goed",
  },
  {
    //value: 'MediocreGood',
    value: 4,
    text: "Matig tot goed",
  },
  {
    //value: 'MediocreBad',
    value: 5,
    text: "Matig tot slecht",
  },
];

export const woodTypeOptions = [
  {
    value: 0,
    text: "Grenen",
  },
  {
    value: 1,
    text: "Vuren",
  },
];

// TODO Hardcoded, enums didn't map
export const substructureOptions = [
  {
    //value: 'Cellar',
    value: 0,
    text: "Kelder",
  },
  {
    //value: 'Basement',
    value: 1,
    text: "Souterrain",
  },
  {
    //value: 'Crawlspace',
    value: 2,
    text: "Kruipruimte",
  },
  {
    //value: 'None',
    value: 3,
    text: "Geen",
  },
];

// TODO Hardcoded, enums didn't map
export const foundationDamageCauseOptions = [
  {
    //value: 'Drainage',
    value: 0,
    text: "Bemaling",
  },
  {
    //value: 'ConstructionFlaw',
    value: 1,
    text: "Constructieve fouten",
  },
  {
    //value: 'Drystand',
    value: 2,
    text: "Droogstand (schimmels)",
  },
  {
    //value: 'Overcharge',
    value: 3,
    text: "Overbelasting",
  },
  {
    //value: 'OverchargeNegativeCling',
    value: 4,
    text: "Overbelasting (negatieve kleef)",
  },
  {
    //value: 'NegativeCling',
    value: 5,
    text: "Negatieve kleef",
  },
  {
    //value: 'BioInfection',
    value: 6,
    text: "Bacteriele aantasting",
  },
  {
    //value: 'FungusInfection',
    value: 8,
    text: "Schimmel aantasting",
  },
  {
    //value: 'BioFungusInfection',
    value: 9,
    text: "Bacterien en schimmel aantasting",
  },
  {
    //value: 'FoundationFlaw',
    value: 10,
    text: "Funderings fouten",
  },
  {
    //value: 'ConstructionHeave',
    value: 11,
    text: "Afglijden fundering",
  },
  {
    //value: 'Subsidence',
    value: 12,
    text: "Bodemdaling",
  },
  {
    //value: 'Vegetation',
    value: 13,
    text: "Aantasting (planten)wortels",
  },
  {
    //value: 'Gas',
    value: 14,
    text: "Gaswinning",
  },
  {
    //value: 'Vibrations',
    value: 15,
    text: "Trillingen",
  },
  {
    //value: 'PartialFoundationRecovery',
    value: 16,
    text: "Funderingsherstel naastgelegen pand",
  },
  {
    //value: 'JapanseKnotweed',
    value: 17,
    text: "Japanse duizendknoop",
  },
];

// TODO Hardcoded, enums didn't map
export const enforcementTermOptions = [
  {
    text: "0-5 jaar",
    //value: 'Term0_5'
    value: 0,
  },
  {
    text: "5-10 jaar",
    //value: 'Term5_10'
    value: 1,
  },
  {
    text: "10-20 jaar",
    //value: 'Term10_20'
    value: 2,
  },
  {
    text: "5 jaar",
    //value: 'Term5'
    value: 3,
  },
  {
    text: "10 jaar",
    //value: 'Term10'
    value: 4,
  },
  {
    text: "15 jaar",
    //value: 'Term15'
    value: 5,
  },
  {
    text: "20 jaar",
    //value: 'Term20'
    value: 6,
  },
  {
    text: "25 jaar",
    //value: 'Term25'
    value: 7,
  },
  {
    text: "30 jaar",
    //value: 'Term30'
    value: 8,
  },
  {
    text: "40 jaar",
    //value: 'Term40'
    value: 9,
  },
];

export const damageCharacteristicsOptions = [
  {
    //value: 'JammingDoorWindow',
    text: "Klemmende deuren en ramen",
    value: 0,
  },
  {
    //value: 'Crack',
    text: "Scheuren",
    value: 1,
  },
  {
    //value: 'Skewed',
    text: "Scheefstand",
    value: 2,
  },
  {
    //value: 'CrawlspaceFlooding',
    text: "Water in kruipruimte",
    value: 3,
  },
  {
    //value: 'ThresholdAboveSubsurface',
    text: "Drempel boven maaiveld",
    value: 4,
  },
  {
    //value: 'ThresholdBelowSubsurface',
    text: "Drempel onder maaiveld",
    value: 5,
  },
  {
    //value: 'CrookedFloorWall',
    text: "Scheve vloer of wand",
    value: 6,
  },
];

// TODO Hardcoded, enums didn't map
// export const BaseMeasurementLevelOptions = [
//   {
//     // value: 'NAP',
//     value: 0,
//     text: 'NAP (Nederland)'
//   },
//   {
//     // value: 'TAW',
//     value: 1,
//     text: 'TAW (België)'
//   },
//   {
//     // value: 'NN',
//     value: 2,
//     text: 'NN (Duitsland)'
//   }
// ]

export const FoundationRecoveryEvidenceTypeOptions = [
  {
    value: "Permit",
    text: "Vergunning",
  },
  {
    value: "FoundationReport",
    text: "Funderingsonderzoek",
  },
  {
    value: "ArchiveReport",
    text: "Archiefonderzoek",
  },
  {
    value: "OwnerEvidence",
    text: "Bewijs Eigenaar",
  },
];

export const FoundationRecoveryType = [
  {
    value: "Table",
    text: "Hersteld met tafelconstructie",
  },
  {
    value: "BeamOnPile",
    text: "Hersteld met randbalken op nieuwe palen",
  },
  {
    value: "PileLowering",
    text: "Paalkopverlaging",
  },
  {
    value: "PileInWall",
    text: "Hersteld met uit muren gedrukte palen",
  },
  {
    value: "Injection",
    text: "Verstevigen van de ondergrond door een injectie met kunsthars",
  },
  {
    value: "Unknown",
    text: "Onbekend",
  },
];

export const facadeScanRiskOptions = [
  {
    text: "A",
    value: 0,
  },
  {
    text: "B",
    value: 1,
  },
  {
    text: "C",
    value: 2,
  },
  {
    text: "D",
    value: 3,
  },
  {
    text: "E",
    value: 4,
  },
];
