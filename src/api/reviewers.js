
import axios from '@/utils/axios'

const getReviewers = () => {
  return axios.get('/api/report/reviewers')
}

export default { 
  getReviewers
}