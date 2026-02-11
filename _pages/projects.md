---
layout: page
title: Projects
permalink: /projects/
description: A growing collection of your cool projects.
nav: true
nav_order: 3
display_categories: [work, fun]
horizontal: false
---

<!-- pages/projects.md -->
<div class="projects">
{% assign project_statuses = "Active Project,Finished Project" | split: "," %}
{% for status in project_statuses %}
<a id="{{ status | slugify }}" href=".#{{ status | slugify }}">
  <h2 class="category">{{ status }}</h2>
</a>
{% assign categorized_projects = site.projects | where_exp: "item", "item.project_status == status" %}
{% assign sorted_projects = categorized_projects | sort: "importance" %}
<!-- Generate cards for each project -->
{% if page.horizontal %}
<div class="container">
  <div class="row row-cols-1 row-cols-md-2">
  {% for project in sorted_projects %}
    {% include projects_horizontal.liquid %}
  {% endfor %}
  </div>
</div>
{% else %}
<div class="row row-cols-1 row-cols-md-3">
  {% for project in sorted_projects %}
    {% include projects.liquid %}
  {% endfor %}
</div>
{% endif %}
{% endfor %}

</div>
