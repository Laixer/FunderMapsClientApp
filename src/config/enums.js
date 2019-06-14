
/**
 * Configuration of Enums
 */

export const typeOptions = [ 
  {
    text: 'AdditionalResearch',
    color: 'white',
    bgColor: '#3D5372'
  }, 
  {
    text: 'Monitoring',
    color: 'white',
    bgColor: '#3D5372'
  }, 
  {
    text: 'Note',
    color: 'white',
    bgColor: '#3D5372'
  }, 
  {
    text: 'Quickscan',
    color: 'white',
    bgColor: '#3D5372'
  }, 
  {
    text: 'Unknown',
    color: 'white',
    bgColor: '#3D5372'
  },
  {
    text: 'DemolitionResearch',
    color: 'white',
    bgColor: '#3D5372'
  }, 
  {
    text: 'SecondOpinion',
    color: 'white',
    bgColor: '#3D5372'
  }, 
  {
    text: 'ArchiveResearch',
    color: 'white',
    bgColor: '#3D5372'
  }, 
  {
    text: 'ArchitecturalResearch',
    color: 'white',
    bgColor: '#3D5372'
  }, 
  {
    text: 'FoundationAdvice',
    color: 'white',
    bgColor: '#3D5372'
  },
  {
    text: 'Inspectionpit',
    color: 'white',
    bgColor: '#3D5372'
  }, 
  {
    text: 'FoundationResearch',
    color: 'white',
    bgColor: '#3D5372'
  }, 
  {
    text: 'GroundWaterLevelResearch',
    color: 'white',
    bgColor: '#3D5372'
  }
]

export const statusOptions = [ 
  {
    text: 'Todo',
    bgColor: '#3D5372'
  }, 
  {
    text: 'Pending',
    bgColor: '#F5A623'
  }, 
  {
    text: 'Done',
    bgColor: '#28CC8B'
  }, 
  {
    text: 'Discarded',
    bgColor: '#3D5372'
  }, 
  {
    text: 'PendingReview',
    bgColor: '#3D5372'
  }, 
  {
    text: 'Rejected',
    bgColor: '#FF4E4E'
  } 
]

export const accessOptions = [ 
  {
    value: 'Public'
  }, 
  {
    value: 'Private'
  } 
]

export const foundationTypeOptions = [
  {
    value: 'Wood',
    text: 'Hout'
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
    value: 'WoodAmsterdam',
    text: 'Hout: Amsterdam fundering'
  },
  {
    value: 'WoodRotterdam',
    text: 'Hout: Rotterdam fundering'
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

export const substructureOptions = [
  {
    value: 'Cellar',
    text: 'Kelder'
  }, 
  { 
    value: 'Basement',
    text: 'Souterrain'
  }, 
  {
    value: 'Crawlspace',
    text: 'Kruipruimte'
  }, 
  { 
    value: 'None',
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
  }
]

export const enforcementTermOptions = [
  {
    text: '0-5 jaar',
    value: 'Term0_5'
  }, 
  {
    text: '5-10 jaar',
    value: 'Term5_10'
  }, 
  {
    text: '10-20 jaar',
    value: 'Term10_20'
  }, 
  {
    text: '5 jaar',
    value: 'Term5'
  }, 
  {
    text: '10 jaar',
    value: 'Term10'
  }, 
  {
    text: '15 jaar',
    value: 'Term15'
  }, 
  {
    text: '20 jaar',
    value: 'Term20'
  }, 
  {
    text: '25 jaar',
    value: 'Term25'
  }, 
  {
    text: '30 jaar',
    value: 'Term30'
  }
]

export const BaseMeasurementLevelOptions = [
  {
    value: 'NAP',
    text: 'NAP'
  }, 
  {
    value: 'TAW',
    text: 'TAW'
  },
  {
    value: 'NN',
    text: 'NN'
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
