import Image from "@tiptap/extension-image";

export const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alt: {
        default: "",
      },
      title: {
        default: null,
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
    };
  },
});

export default CustomImage;
