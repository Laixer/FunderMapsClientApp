
export const userRoles = [
  { value: 'Superuser', text: 'Beheerder' },
  { value: 'Verifier', text: 'Reviewer' },
  { value: 'Writer', text: 'Verwerker' },
  { value: 'Reader', text: 'Alleen lezen' }
]

// TODO This is a tempfix because strings 
// aren't mapped  to enums in our backend.
export const userRolesToInteger = [
  { value: 'Superuser', number: 0 },
  { value: 'Verifier', number: 1 },
  { value: 'Writer', number: 2 },
  { value: 'Reader', number: 3 }
]

export function userRoleToInteger({ roleAsEnumText }) {
  return userRolesToInteger.find(x => x.value === roleAsEnumText).number;
}