
import axios from '@/utils/axios'

const getReviewers = () => {
  return axios.get('/api/organization/reviewers')
}

export default { 
  getReviewers
}