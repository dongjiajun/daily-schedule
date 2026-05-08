package com.dailyschedule.api.generated.dto;

import java.net.URI;
import java.util.Objects;
import com.dailyschedule.api.generated.dto.TagResponse;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.lang.Nullable;
import java.time.OffsetDateTime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import io.swagger.v3.oas.annotations.media.Schema;


import java.util.*;
import jakarta.annotation.Generated;

/**
 * EventResponse
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", date = "2026-05-09T02:57:31.199757900+08:00[Asia/Shanghai]", comments = "Generator version: 7.12.0")
public class EventResponse {

  private @Nullable Long id;

  private @Nullable String title;

  private @Nullable String description;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private @Nullable LocalDateTime startTime;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private @Nullable LocalDateTime endTime;

  private @Nullable Boolean allDay;

  private @Nullable String location;

  private @Nullable String color;

  private @Nullable Integer reminderMinutes;

  private @Nullable Long categoryId;

  private @Nullable String categoryName;

  private @Nullable String categoryColor;

  @Valid
  private List<@Valid TagResponse> tags = new ArrayList<>();

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private @Nullable LocalDateTime createdAt;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private @Nullable LocalDateTime updatedAt;

  public EventResponse id(Long id) {
    this.id = id;
    return this;
  }

  /**
   * Get id
   * @return id
   */
  
  @Schema(name = "id", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
  @JsonProperty("id")
  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public EventResponse title(String title) {
    this.title = title;
    return this;
  }

  /**
   * Get title
   * @return title
   */
  
  @Schema(name = "title", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
  @JsonProperty("title")
  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public EventResponse description(String description) {
    this.description = description;
    return this;
  }

  /**
   * Get description
   * @return description
   */
  
  @Schema(name = "description", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
  @JsonProperty("description")
  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public EventResponse startTime(LocalDateTime startTime) {
    this.startTime = startTime;
    return this;
  }

  /**
   * Get startTime
   * @return startTime
   */
  @Valid 
  @Schema(name = "startTime", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
  @JsonProperty("startTime")
  public LocalDateTime getStartTime() {
    return startTime;
  }

  public void setStartTime(LocalDateTime startTime) {
    this.startTime = startTime;
  }

  public EventResponse endTime(LocalDateTime endTime) {
    this.endTime = endTime;
    return this;
  }

  /**
   * Get endTime
   * @return endTime
   */
  @Valid 
  @Schema(name = "endTime", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
  @JsonProperty("endTime")
  public LocalDateTime getEndTime() {
    return endTime;
  }

  public void setEndTime(LocalDateTime endTime) {
    this.endTime = endTime;
  }

  public EventResponse allDay(Boolean allDay) {
    this.allDay = allDay;
    return this;
  }

  /**
   * Get allDay
   * @return allDay
   */
  
  @Schema(name = "allDay", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
  @JsonProperty("allDay")
  public Boolean getAllDay() {
    return allDay;
  }

  public void setAllDay(Boolean allDay) {
    this.allDay = allDay;
  }

  public EventResponse location(String location) {
    this.location = location;
    return this;
  }

  /**
   * Get location
   * @return location
   */
  
  @Schema(name = "location", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
  @JsonProperty("location")
  public String getLocation() {
    return location;
  }

  public void setLocation(String location) {
    this.location = location;
  }

  public EventResponse color(String color) {
    this.color = color;
    return this;
  }

  /**
   * Get color
   * @return color
   */
  
  @Schema(name = "color", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
  @JsonProperty("color")
  public String getColor() {
    return color;
  }

  public void setColor(String color) {
    this.color = color;
  }

  public EventResponse reminderMinutes(Integer reminderMinutes) {
    this.reminderMinutes = reminderMinutes;
    return this;
  }

  /**
   * Get reminderMinutes
   * @return reminderMinutes
   */
  
  @Schema(name = "reminderMinutes", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
  @JsonProperty("reminderMinutes")
  public Integer getReminderMinutes() {
    return reminderMinutes;
  }

  public void setReminderMinutes(Integer reminderMinutes) {
    this.reminderMinutes = reminderMinutes;
  }

  public EventResponse categoryId(Long categoryId) {
    this.categoryId = categoryId;
    return this;
  }

  /**
   * Get categoryId
   * @return categoryId
   */
  
  @Schema(name = "categoryId", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
  @JsonProperty("categoryId")
  public Long getCategoryId() {
    return categoryId;
  }

  public void setCategoryId(Long categoryId) {
    this.categoryId = categoryId;
  }

  public EventResponse categoryName(String categoryName) {
    this.categoryName = categoryName;
    return this;
  }

  /**
   * Get categoryName
   * @return categoryName
   */
  
  @Schema(name = "categoryName", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
  @JsonProperty("categoryName")
  public String getCategoryName() {
    return categoryName;
  }

  public void setCategoryName(String categoryName) {
    this.categoryName = categoryName;
  }

  public EventResponse categoryColor(String categoryColor) {
    this.categoryColor = categoryColor;
    return this;
  }

  /**
   * Get categoryColor
   * @return categoryColor
   */
  
  @Schema(name = "categoryColor", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
  @JsonProperty("categoryColor")
  public String getCategoryColor() {
    return categoryColor;
  }

  public void setCategoryColor(String categoryColor) {
    this.categoryColor = categoryColor;
  }

  public EventResponse tags(List<@Valid TagResponse> tags) {
    this.tags = tags;
    return this;
  }

  public EventResponse addTagsItem(TagResponse tagsItem) {
    if (this.tags == null) {
      this.tags = new ArrayList<>();
    }
    this.tags.add(tagsItem);
    return this;
  }

  /**
   * Get tags
   * @return tags
   */
  @Valid 
  @Schema(name = "tags", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
  @JsonProperty("tags")
  public List<@Valid TagResponse> getTags() {
    return tags;
  }

  public void setTags(List<@Valid TagResponse> tags) {
    this.tags = tags;
  }

  public EventResponse createdAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
    return this;
  }

  /**
   * Get createdAt
   * @return createdAt
   */
  @Valid 
  @Schema(name = "createdAt", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
  @JsonProperty("createdAt")
  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public EventResponse updatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
    return this;
  }

  /**
   * Get updatedAt
   * @return updatedAt
   */
  @Valid 
  @Schema(name = "updatedAt", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
  @JsonProperty("updatedAt")
  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    EventResponse eventResponse = (EventResponse) o;
    return Objects.equals(this.id, eventResponse.id) &&
        Objects.equals(this.title, eventResponse.title) &&
        Objects.equals(this.description, eventResponse.description) &&
        Objects.equals(this.startTime, eventResponse.startTime) &&
        Objects.equals(this.endTime, eventResponse.endTime) &&
        Objects.equals(this.allDay, eventResponse.allDay) &&
        Objects.equals(this.location, eventResponse.location) &&
        Objects.equals(this.color, eventResponse.color) &&
        Objects.equals(this.reminderMinutes, eventResponse.reminderMinutes) &&
        Objects.equals(this.categoryId, eventResponse.categoryId) &&
        Objects.equals(this.categoryName, eventResponse.categoryName) &&
        Objects.equals(this.categoryColor, eventResponse.categoryColor) &&
        Objects.equals(this.tags, eventResponse.tags) &&
        Objects.equals(this.createdAt, eventResponse.createdAt) &&
        Objects.equals(this.updatedAt, eventResponse.updatedAt);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, title, description, startTime, endTime, allDay, location, color, reminderMinutes, categoryId, categoryName, categoryColor, tags, createdAt, updatedAt);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class EventResponse {\n");
    sb.append("    id: ").append(toIndentedString(id)).append("\n");
    sb.append("    title: ").append(toIndentedString(title)).append("\n");
    sb.append("    description: ").append(toIndentedString(description)).append("\n");
    sb.append("    startTime: ").append(toIndentedString(startTime)).append("\n");
    sb.append("    endTime: ").append(toIndentedString(endTime)).append("\n");
    sb.append("    allDay: ").append(toIndentedString(allDay)).append("\n");
    sb.append("    location: ").append(toIndentedString(location)).append("\n");
    sb.append("    color: ").append(toIndentedString(color)).append("\n");
    sb.append("    reminderMinutes: ").append(toIndentedString(reminderMinutes)).append("\n");
    sb.append("    categoryId: ").append(toIndentedString(categoryId)).append("\n");
    sb.append("    categoryName: ").append(toIndentedString(categoryName)).append("\n");
    sb.append("    categoryColor: ").append(toIndentedString(categoryColor)).append("\n");
    sb.append("    tags: ").append(toIndentedString(tags)).append("\n");
    sb.append("    createdAt: ").append(toIndentedString(createdAt)).append("\n");
    sb.append("    updatedAt: ").append(toIndentedString(updatedAt)).append("\n");
    sb.append("}");
    return sb.toString();
  }

  /**
   * Convert the given object to string with each line indented by 4 spaces
   * (except the first line).
   */
  private String toIndentedString(Object o) {
    if (o == null) {
      return "null";
    }
    return o.toString().replace("\n", "\n    ");
  }
}

