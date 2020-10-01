
// TODO: Only submit integers to backend

/**
 * Configuration of Enums
 */

export const typeOptions = [
  {
    text: 'Aanvullend onderzoek',
    color: 'white',
    bgColor: '#3D5372'
  },
  {
    text: 'Monitoring',
    color: 'white',
    bgColor: '#3D5372'
  },
  {
    text: 'Notitie',
    color: 'white',
    bgColor: '#3D5372'
  },
  {
    text: 'Quickscan',
    color: 'white',
    bgColor: '#3D5372'
  },
  {
    text: 'Onbekend',
    color: 'white',
    bgColor: '#3D5372'
  },
  {
    text: 'Sloopgrens onderzoek',
    color: 'white',
    bgColor: '#3D5372'
  },
  {
    text: 'Second opinion',
    color: 'white',
    bgColor: '#3D5372'
  },
  {
    text: 'Archief onderzoek',
    color: 'white',
    bgColor: '#3D5372'
  },
  {
    text: 'Bouwkundig onderzoek',
    color: 'white',
    bgColor: '#3D5372'
  },
  {
    text: 'Funderingsadvies',
    color: 'white',
    bgColor: '#3D5372'
  },
  {
    text: 'Inspectieput',
    color: 'white',
    bgColor: '#3D5372'
  },
  {
    text: 'Funderings onderzoek',
    color: 'white',
    bgColor: '#3D5372'
  },
  {
    text: 'Grondwater onderzoek',
    color: 'white',
    bgColor: '#3D5372'
  }
]

export const statusOptions = [
  {
    text: 'Todo',
    label: 'Nog te beoordelen',
    bgColor: '#3D5372'
  },
  {
    text: 'Pending',
    label: 'In bewerking',
    bgColor: '#F5A623'
  },
  {
    text: 'Done',
    label: 'Afgerond',
    bgColor: '#28CC8B'
  },
  {
    text: 'Discarded',
    label: 'Afgevallen',
    bgColor: '#3D5372'
  },
  {
    text: 'PendingReview',
    label: 'Gecontroleerd',
    bgColor: '#3D5372'
  },
  {
    text: 'Rejected',
    label: 'Afgekeurd',
    bgColor: '#FF4E4E'
  }
]

export const accessOptions = [
  {
    value: 'Public',
    label: 'Openbaar'
  },
  {
    value: 'Private',
    label: 'Gesloten'
  }
]

export const foundationTypeOptions = [
  {
    value: 'Wood',
    text: 'Hout'
  },
  {
    value: 'WoodAmsterdam',
    text: 'Hout: Amsterdam fundering'
  },
  {
    value: 'WoodRotterdam',
    text: 'Hout: Rotterdam fundering'
  },
  {
    value: 'Concrete',
    text: 'Beton'
  },
  {
    value: 'NoPile',
    text: 'Niet onderheid'
  },
  {
    value: 'NoPileMasonry',
    text: 'Niet onderheid: gemetseld'
  },
  {
    value: 'NoPileStrips',
    text: 'Niet onderheid: stroken fundering'
  },
  {
    value: 'NoPileBearingFloor',
    text: 'Niet onderheid: fundering met dragen vloer'
  },
  {
    value: 'NoPileConcreteFloor',
    text: 'Niet onderheid: dragende betonvloer'
  },
  {
    value: 'NoPileSlit',
    text: 'Niet onderheid: slieten'
  },
  {
    value: 'WoodCharger',
    text: 'Hout met oplanger'
  },
  {
    value: 'WeightedPile',
    text: 'Verzwaardepuntpaal'
  },
  {
    value: 'Combined',
    text: 'Gecombineerd'
  },
  {
    value: 'SteelPile',
    text: 'Stalen buispalen'
  },
  {
    value: 'Other',
    text: 'Overig'
  },
  {
    value: 'Unknown',
    text: 'Onbekend'
  }
]

export const foundationQualityOptions = [
  {
    value: 'Bad',
    text: 'Slecht'
  },
  {
    value: 'Mediocre',
    text: 'Matig'
  },
  {
    value: 'Tolerable',
    text: 'Redelijk'
  },
  {
    value: 'Good',
    text: 'Goed'
  },
  {
    value: 'MediocreGood',
    text: 'Matig tot goed'
  },
  {
    value: 'MediocreBad',
    text: 'Matig tot slecht'
  }
]

// TODO Hardcoded
export const substructureOptions = [
  {
    //value: 'Cellar',
    value: 0,
    text: 'Kelder'
  },
  {
    //value: 'Basement',
    value: 1,
    text: 'Souterrain'
  },
  {
    //value: 'Crawlspace',
    value: 2,
    text: 'Kruipruimte'
  },
  {
    //value: 'None',
    value: 3,
    text: 'Geen'
  }
]

export const foundationDamageCauseOptions = [
  {
    value: 'Drainage',
    text: 'Bemaling'
  },
  {
    value: 'ConstructionFlaw',
    text: 'Constructieve fouten'
  },
  {
    value: 'Drystand',
    text: 'Droogstand (schimmels)'
  },
  {
    value: 'Overcharge',
    text: 'Overbelasting'
  },
  {
    value: 'OverchargeNegativeCling',
    text: 'Overbelasting (negatieve kleef)'
  },
  {
    value: 'NegativeCling',
    text: 'Negatieve kleef'
  },
  {
    value: 'BioInfection',
    text: 'Bacteriele aantasting'
  },
  {
    value: 'Unknown',
    text: 'Niet vermeld'
  },
  {
    value: 'FungusInfection',
    text: 'Bacterien en schimmels aantasting'
  },
  {
    value: 'foundationFlaw',
    text: 'Funderings fouten'
  },
  {
    value: 'constructionHeave',
    text: 'Afglijden fundering'
  },
  {
    value: 'subsidence',
    text: 'Bodemdaling'
  },
  {
    value: 'vegetation',
    text: 'Aantasting (planten)wortels'
  },
  {
    value: 'gas',
    text: 'Gaswinning'
  },
  {
    value: 'vibrations',
    text: 'Trillingen'
  },
  {
    value: 'partial_foundation_recovery',
    text: 'Funderingsherstel naastgelegen pand'
  },
]

export const enforcementTermOptions = [
  {
    text: '0-5 jaar',
    //value: 'Term0_5'
    value: 0
  },
  {
    text: '5-10 jaar',
    //value: 'Term5_10'
    value: 1
  },
  {
    text: '10-20 jaar',
    //value: 'Term10_20'
    value: 2
  },
  {
    text: '5 jaar',
    //value: 'Term5'
    value: 3 
  },
  {
    text: '10 jaar',
    //value: 'Term10'
    value: 4
  },
  {
    text: '15 jaar',
    //value: 'Term15'
    value: 5
  },
  {
    text: '20 jaar',
    //value: 'Term20'
    value: 6
  },
  {
    text: '25 jaar',
    //value: 'Term25'
    value: 7
  },
  {
    text: '30 jaar',
    //value: 'Term30'
    value: 8
  },
  {
    text: '40 jaar',
    //value: 'Term40'
    value: 9
  }
]

export const BaseMeasurementLevelOptions = [
  {
    value: 'NAP',
    text: 'NAP (Nederland)'
  },
  {
    value: 'TAW',
    text: 'TAW (België)'
  },
  {
    value: 'NN',
    text: 'NN (Duitsland)'
  }
]

export const FoundationRecoveryEvidenceTypeOptions = [
  {
    value: 'Permit',
    text: 'Vergunning'
  },
  {
    value: 'FoundationReport',
    text: 'Funderingsonderzoek'
  },
  {
    value: 'ArchiveReport',
    text: 'Archiefonderzoek'
  },
  {
    value: 'OwnerEvidence',
    text: 'Bewijs Eigenaar'
  }
]

export const FoundationRecoveryType = [
  {
    value: 'Table',
    text: 'Hersteld met tafelconstructie'
  },
  {
    value: 'BeamOnPile',
    text: 'Hersteld met randbalken op nieuwe palen'
  },
  {
    value: 'PileLowering',
    text: 'Paalkopverlaging'
  },
  {
    value: 'PileInWall',
    text: 'Hersteld met uit muren gedrukte palen'
  },
  {
    value: 'Injection',
    text: 'Verstevigen van de ondergrond door een injectie met kunsthars'
  },
  {
    value: 'Unknown',
    text: 'Onbekend'
  }
]
