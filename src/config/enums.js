
/**
 * Configuration of Enums
 */

export const typeOptions = [ 
  {
    label: 'AdditionalResearch',
    color: 'white',
    bgColor: '#3D5372'
  }, 
  {
    label: 'Monitoring',
    color: 'white',
    bgColor: '#3D5372'
  }, 
  {
    label: 'Note',
    color: 'white',
    bgColor: '#3D5372'
  }, 
  {
    label: 'Quickscan',
    color: 'white',
    bgColor: '#3D5372'
  }, 
  {
    label: 'Unknown',
    color: 'white',
    bgColor: '#3D5372'
  },
  {
    label: 'DemolitionResearch',
    color: 'white',
    bgColor: '#3D5372'
  }, 
  {
    label: 'SecondOpinion',
    color: 'white',
    bgColor: '#3D5372'
  }, 
  {
    label: 'ArchieveResearch',
    color: 'white',
    bgColor: '#3D5372'
  }, 
  {
    label: 'ArchitecturalResearch',
    color: 'white',
    bgColor: '#3D5372'
  }, 
  {
    label: 'FoundationAdvice',
    color: 'white',
    bgColor: '#3D5372'
  },
  {
    label: 'Inspectionpit',
    color: 'white',
    bgColor: '#3D5372'
  }, 
  {
    label: 'FoundationResearch',
    color: 'white',
    bgColor: '#3D5372'
  }, 
  {
    label: 'GroundWaterLevelResearch',
    color: 'white',
    bgColor: '#3D5372'
  }
]

export const statusOptions = [ 
  {
    label: 'Todo',
    bgColor: '#3D5372'
  }, 
  {
    label: 'Pending',
    bgColor: '#F5A623'
  }, 
  {
    label: 'Done',
    bgColor: '#3D5372'
  }, 
  {
    label: 'Discarded',
    bgColor: '#3D5372'
  }, 
  {
    label: 'PendingReview',
    bgColor: '#3D5372'
  }, 
  {
    label: 'Rejected',
    bgColor: '#3D5372'
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
  'Wood', 'WoodAmsterdam', 'WoodRotterdam', 'Concrete', 'NoPile', 'NoPileMasonry', 'NoPileStrips', 'NoPileBearingFloor', 'NoPileConcreteFloor', 'NoPileSlit', 'WoodCharger', 'WeightedPile', 'Combined', 'SteelPile', 'Other', 'Unknown'
]

export const foundationQualityOptions = [
  {
    value: 'Bad',
    label: 'Slect'
  }, 
  {
    value: 'Mediocre',
    label: 'Matig'
  }, 
  {
    value: 'Tolerable',
    label: 'Acceptabel'
  },
  {
    value: 'Good',
    label: 'Goed'
  },
  {
    value: 'MediocreGood',
    label: 'Matig tot goed'
  },
  {
    value: 'MediocreBad',
    label: 'Matig tot slecht'
  }
]

export const substructureOptions = [
  {
    value: 'Cellar',
    label: 'Kelder'
  }, 
  { 
    value: 'Basement',
    label: 'Souterrain'
  }, 
  {
    value: 'Crawlspace',
    label: 'Kruipruimte'
  }, 
  { 
    value: 'None',
    label: 'Geen'
  }
]

export const foundationDamageCauseOptions = [
  'Drainage', 'ConstructionFlaw', 'Crystand', 'Overcharge', 'OverchargeNegativeCling', 'NegativeCling', 'BioInfection', 'Unknown', 'FungusInfection'
]

export const enforcementTermOptions = [
  {
    label: '0 tot 5 jaar',
    value: 'Term0_5'
  }, 
  {
    label: '5 tot 10 jaar',
    value: 'Term5_10'
  }, 
  {
    label: '10 tot 20 jaar',
    value: 'Term10_20'
  }, 
  {
    label: '5 jaar',
    value: 'Term5'
  }, 
  {
    label: '10 jaar',
    value: 'Term10'
  }, 
  {
    label: '15 jaar',
    value: 'Term15'
  }, 
  {
    label: '20 jaar',
    value: 'Term20'
  }, 
  {
    label: '25 jaar',
    value: 'Term25'
  }, 
  {
    label: '30 jaar',
    value: 'Term30'
  }
]

export const BaseMeasurementLevelOptions = [
  {
    value: 'NAP',
    label: 'NAP'
  }, 
  {
    value: 'TAW',
    label: 'TAW'
  },
  {
    value: 'NN',
    label: 'NN'
  }
]
