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

// TODO Hardcoded, enums didn't map
export const foundationTypeOptions = [
  {
    value: null,
    text: "Selecteer een optie",
    group: null,
  },
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
    group: "wood",
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
  {
    value: 2,
    text: "2",
  },
  {
    value: 3,
    text: "3",
  },
  {
    value: 4,
    text: "4",
  },
  {
    value: 5,
    text: "5",
  },
];

export const rotationOptions = [
  {
    //value: 'Nihil',
    value: 0,
    text: "Nihil",
  },
  {
    //value: 'Very small',
    value: 1,
    text: "Heel klein",
  },
  {
    //value: 'Small',
    value: 2,
    text: "Klein",
  },
  {
    //value: 'Mediocre',
    value: 3,
    text: "Middelmatig",
  },
  {
    //value: 'Big',
    value: 4,
    text: "Groot",
  },
];

export const qualityOptions = [
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
  // {
  //   //value: 'Unknown',
  //   value: 7,
  //   text: 'Niet vermeld'
  // },
  {
    //value: 'FungusInfection',
    value: 8,
    text: "Bacterien en schimmels aantasting",
  },
  {
    //value: 'foundationFlaw',
    value: 9,
    text: "Funderings fouten",
  },
  {
    //value: 'constructionHeave',
    value: 10,
    text: "Afglijden fundering",
  },
  {
    //value: 'subsidence',
    value: 11,
    text: "Bodemdaling",
  },
  {
    //value: 'vegetation',
    value: 12,
    text: "Aantasting (planten)wortels",
  },
  {
    //value: 'gas',
    value: 13,
    text: "Gaswinning",
  },
  {
    //value: 'vibrations',
    value: 14,
    text: "Trillingen",
  },
  {
    //value: 'partial_foundation_recovery',
    value: 15,
    text: "Funderingsherstel naastgelegen pand",
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
    text: "Scheuren",
    value: 0,
  },
  {
    text: "Ingestord",
    value: 1,
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
