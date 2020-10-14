<template>
  <div class="Sample">
    <SampleLine
      v-bind:addressId="addressId"
      :open="open"
      :editMode="editMode"
      @save="handleSave"
      @delete="handleDelete"
      @toggle="handleToggle"
    />
    <div v-show="open" class="Sample__details">
      <SampleDataEditor
        v-if="editMode"
        ref="editor"
        @stored="handleStored"
        @addressSelected="handleAddressSelected"
        :sample="sample"
      />
      <SampleDataPresentation v-if="!editMode" :sample="sample" />
    </div>
  </div>
</template>

<script>
import SampleLine from "molecule/SampleLine";
import SampleDataPresentation from "molecule/SampleDataPresentation";
import SampleDataEditor from "organism/SampleDataEditor";

/**
 * Import model.
 */
import AddressModel from "../../models/Address.ts";

export default {
  components: {
    SampleLine,
    SampleDataPresentation,
    SampleDataEditor,
  },
  props: {
    sample: {
      type: Object,
      required: true,
    },
    editMode: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    open() {
      return this.sample.editorState === "open";
    },
    classList() {
      return {
        "SampleLine--open": true,
      };
    }
  },
  data: function() {
    return {
      addressId: null
    }
  },
  methods: {
    handleToggle() {
      if (this.open) {
        this.sample.closeEditor();
      } else {
        this.sample.openEditor();
      }
    },
    /**
     * Called when we select an address from the autocomplete field.
     */
    handleAddressSelected(event) {
      this.addressId = event.addressId;
    },
    async save() {
      return await this.handleSave();
    },
    isStored() {
      return this.$refs.editor ? this.$refs.editor.isStored() : false;
    },
    handleSave() {
      if (this.$refs.editor) {
        return this.$refs.editor.save();
      }
    },
    handleDelete() {
      if (this.$refs.editor) {
        this.$refs.editor.delete();
      }
    },
    handleStored(payload) {
      this.$emit("stored", payload);
    },
  },
  created() {
    // TODO Is this correct?
    this.addressId = this.sample.address;
  }
};
</script>

<style lang="scss">
.Sample {
  border: 1px solid #ced0da;
  background-color: #fafbfc;
  border-radius: 5px;
  margin-top: 10px;
  overflow: hidden;

  &__details {
    position: relative;
    background: #fafbfc;
    border-top: 1px solid #ced0da;

    &:after {
      position: absolute;
      content: "";
      top: -7px;
      left: 54px;
      width: 12px;
      height: 12px;
      border-top: 1px solid #ced0da;
      border-right: 1px solid #ced0da;
      background: #fafbfc;
      transform: rotate(-45deg);
    }
  }
}
</style>
