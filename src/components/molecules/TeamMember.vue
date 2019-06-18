<template>
  <div 
    class="TeamMember mb-3 d-flex align-items-center" >
    <img class="mr-2 rounded-circle" :src="member.getAvatar()" width="60" height="60" />
    <div class="pl-1 d-flex flex-column flex-grow-1 align-items-start">
      <span>{{ member.getUserName() }} ({{ member.getRoleName() }})</span>
      <b-button
        class="font-weight-bold mt-2"
        variant="light"
        @click="$emit('edit', { id: member.user.id })">
        Bewerk
      </b-button>
    </div>
  </div>
</template>

<script>
import { image } from 'helper/assets'
export default {
  props: {
    member: {
      type: [Object, Boolean],
      default: false
    }
  },
  methods: {
    image
  }
}
</script>

<style lang="scss">
.TeamMember {
  color: #354052;

  span {
    line-height: 1
  }

  .btn {
    color: #7F8FA4;

    &:hover, &:active {
      color: darken(#7F8FA4, 10%)
    }
  }

  &__btna {
    border: 1px solid #CED0DA;
    border-radius: 4px;
    height: 30px;
    color: #354052;
    cursor: pointer;
    max-width: 120px;

    background: #FFFFFF;
    background: -moz-linear-gradient(top, #FFFFFF 0%, #F2F4F7 100%);
    background: -webkit-linear-gradient(top, #FFFFFF 0%,#F2F4F7 100%);
    background: linear-gradient(to bottom, #FFFFFF 0%,#F2F4F7 100%);
    filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#FFFFFF', endColorstr='#F2F4F7',GradientType=0 );

    span {
      display: inline-block;
      margin-left: 10px;
      line-height: 1;
    }
  }
}
</style>
