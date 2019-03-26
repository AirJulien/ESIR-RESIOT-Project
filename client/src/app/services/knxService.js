import Api from '@/services/Api'

export default {
  connect () {
    return Api.get('/kniot/connect')
  },
  disconnect () {
    return Api.get('/kniot/disconnect')
  },
  startAllLights () {
    return Api.get('/kniot/startAllLights')
  },
  stopAllLights () {
    return Api.get('/kniot/stopAllLights')
  },
  startLight (param) {
    return Api.get('/kniot/startLight/'+param)
  },
  stopLight (param) {
    return Api.get('/kniot/stopLight/'+param)
  },
  startChase () {
    return Api.get('/kniot/startChase')
  },
  stopChase () {
    return Api.get('/kniot/stopChase')
  },
  intervalUp (){
    return Api.get('/kniot/interval/up')
  },
  intervalDown (){
    return Api.get('/kniot/interval/down')
  },
  reverse (){
    return Api.get('/kniot/reverse')
  }
}
