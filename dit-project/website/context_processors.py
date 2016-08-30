from cms.models.pluginmodel import CMSPlugin

def page_extra(request):
    page = request.current_page
    if page:
        cover_image_plugin = CMSPlugin.objects.filter(
            placeholder__page=page,
            placeholder__slot='cover_image',
            plugin_type='FilerImagePlugin',
        ).first()
        if cover_image_plugin:
            return {'cover': cover_image_plugin.filerimage.image}
    return {}