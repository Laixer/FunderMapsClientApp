<template>
  <div>
    <Feedback :feedback="feedback" />
    <vue2Dropzone 
      id="dropzone"
      v-if="canWrite()"
      ref="dropzone"
      :options="options"
      useCustomSlot
      @vdropzone-sending="addHeaderBeforeSending"
      @vdropzone-success="handleSuccess"
      @vdropzone-error="handleError"
      class="UploadArea d-flex justify-content-center">
      <div class="align-self-center">
        <img 
          alt="upload" 
          :src="image('upload.svg')" />
        <p class="mb-0 mt-3">
          <strong>
            Slepen en neerzetten voor upload
          </strong>
          <br>
          <span>
            of 
            <span>bladeren</span>
            om een bestand te kiezen
          </span>
        </p>
      </div>
    </vue2Dropzone>
  </div>
</template>

<script>
import { image } from 'helper/assets'
import vue2Dropzone from 'vue2-dropzone'
import 'vue2-dropzone/dist/vue2Dropzone.min.css'
import Feedback from 'atom/Feedback'

import { authHeader, canWrite } from 'service/auth';

export default {
  components: {
    vue2Dropzone, Feedback
  },
  data() {
    return {
      feedback: {
        message: '',
        variant: ''
      },
      options: {
        maxFiles: 1,
        maxFileSize: 20,
        // acceptedFiles: 'image/*,application/pdf',
        url: (process.env.VUE_APP_API_BASE_URL + '/api/report/upload').replace(/([^:]\/)\/+/g, "$1") // TODO: Move to API
      }
    }
  },
  methods: {
    image,
    canWrite,
    /**
     * Add the Authorization header when the upload process starts
     */
    addHeaderBeforeSending(file, xhr) {
      this.feedback = {
        message: '',
        variant: ''
      }

      if (xhr.setRequestHeader) {
        let header = authHeader()
        xhr.setRequestHeader('Authorization', header.Authorization);
      }
    },
    /**
     * Start the creation of a new report once the upload has finished with success
     */
    handleSuccess(file, response) {
      if (file && this.$refs.dropzone) {
        this.$refs.dropzone.removeFile(file)
      }
      this.$router.push({
        name: 'new-report',
        params: {
          file: response
        } 
      })
    },
    handleError(file) { // error
      if (file && this.$refs.dropzone) {
        this.$refs.dropzone.removeFile(file)
      }
      
      this.feedback = {
        message: 'Het bestand kon niet verwerkt worden.',
        variant: 'danger'
      }
    }
  }
}
</script>

<style lang="scss">
.UploadArea {
  width: 100%;
  height: 300px;
  border-radius: 15px;
  background-color: rgba(255, 255, 255, 0.7);
  border: 3px dashed #9EA9B8;
  user-select: none;
  cursor: pointer;

  p {
    text-align: center;
    font-size: 14px;
    color: #354052;
    font-weight: 300;
    line-height: 17px;

    strong {
      font-size: 18px;
      color: #373C41;
      font-weight: 600;
    }
    span span {
      color: #1991EB;
      font-weight: 600;
      text-decoration: underline;
      cursor: pointer;
    }
  }

  // DropZone styling
  .dz-message {
    align-self: center;
  }
  &.vue-dropzone {
    font-family: 'Gibson' !important;
  }
  &.vue-dropzone:hover {
    background-color: white;
  }
  &.vue-dropzone>.dz-preview .dz-details {
    background: #17A4EA;
  }
}

</style>
