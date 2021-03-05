
<script>
// TODO: Unused for now
import { image } from 'helper/assets'

export default {
  name: 'FadedBackgroundCover',
  functional: true,
  props: {
    image: {
      type: String,
      default: 'login/background.png'
    }
  },
  render(h, context) {
    return h('div', {
      class: {
        'FadedBackgroundCover' : true
      },
      style: {
        backgroundImage: 'url(' + image(context.props.image) + ')'
      },
    })
  }
}
</script>

<style lang="scss">

.FadedBackgroundCover {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background-color: transparentize($color: $primary, $amount: 0.75);
  background-repeat: no-repeat;
  background-size: cover;
}
</style>
