package com.dailyschedule.api.generated.dto;

import java.net.URI;
import java.util.Objects;
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
 * EventUpdateRequest
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", date = "2026-05-09T02:57:31.199757900+08:00[Asia/Shanghai]", comments = "Generator version: 7.12.0")
public class EventUpdateRequest {

  private String title;

  private @Nullable String description;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private LocalDateTime startTime;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private LocalDateTime endTime;

  private Boolean allDay = false;

  private @Nullable String location;

  private @Nullable String color;

  private @Nullable Integer reminderMinutes;

  private @Nullable Long categoryId;

  @Valid
  private List<Long> tagIds = new ArrayList<>();

  public EventUpdateRequest() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public EventUpdateRequest(String title, LocalDateTime startTime, LocalDateTime endTime) {
    this.title = title;
    this.startTime = startTime;
    this.endTime = endTime;
  }

  public EventUpdateRequest title(String title) {
    this.title = title;
    return this;
  }

  /**
   * Get title
   * @return title
   */
  @NotNull @Size(max = 200) 
  @Schema(name = "title", requiredMode = Schema.RequiredMode.REQUIRED)
  @JsonProperty("title")
  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public EventUpdateRequest description(String description) {
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

  public EventUpdateRequest startTime(LocalDateTime startTime) {
    this.startTime = startTime;
    return this;
  }

  /**
   * Get startTime
   * @return startTime
   */
  @NotNull @Valid 
  @Schema(name = "startTime", requiredMode = Schema.RequiredMode.REQUIRED)
  @JsonProperty("startTime")
  public LocalDateTime getStartTime() {
    return startTime;
  }

  public void setStartTime(LocalDateTime startTime) {
    this.startTime = startTime;
  }

  public EventUpdateRequest endTime(LocalDateTime endTime) {
    this.endTime = endTime;
    return this;
  }

  /**
   * Get endTime
   * @return endTime
   */
  @NotNull @Valid 
  @Schema(name = "endTime", requiredMode = Schema.RequiredMode.REQUIRED)
  @JsonProperty("endTime")
  public LocalDateTime getEndTime() {
    return endTime;
  }

  public void setEndTime(LocalDateTime endTime) {
    this.endTime = endTime;
  }

  public EventUpdateRequest allDay(Boolean allDay) {
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

  public EventUpdateRequest location(String location) {
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

  public EventUpdateRequest color(String color) {
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

  public EventUpdateRequest reminderMinutes(Integer reminderMinutes) {
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

  public EventUpdateRequest categoryId(Long categoryId) {
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

  public EventUpdateRequest tagIds(List<Long> tagIds) {
    this.tagIds = tagIds;
    return this;
  }

  public EventUpdateRequest addTagIdsItem(Long tagIdsItem) {
    if (this.tagIds == null) {
      this.tagIds = new ArrayList<>();
    }
    this.tagIds.add(tagIdsItem);
    return this;
  }

  /**
   * Get tagIds
   * @return tagIds
   */
  
  @Schema(name = "tagIds", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
  @JsonProperty("tagIds")
  public List<Long> getTagIds() {
    return tagIds;
  }

  public void setTagIds(List<Long> tagIds) {
    this.tagIds = tagIds;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    EventUpdateRequest eventUpdateRequest = (EventUpdateRequest) o;
    return Objects.equals(this.title, eventUpdateRequest.title) &&
        Objects.equals(this.description, eventUpdateRequest.description) &&
        Objects.equals(this.startTime, eventUpdateRequest.startTime) &&
        Objects.equals(this.endTime, eventUpdateRequest.endTime) &&
        Objects.equals(this.allDay, eventUpdateRequest.allDay) &&
        Objects.equals(this.location, eventUpdateRequest.location) &&
        Objects.equals(this.color, eventUpdateRequest.color) &&
        Objects.equals(this.reminderMinutes, eventUpdateRequest.reminderMinutes) &&
        Objects.equals(this.categoryId, eventUpdateRequest.categoryId) &&
        Objects.equals(this.tagIds, eventUpdateRequest.tagIds);
  }

  @Override
  public int hashCode() {
    return Objects.hash(title, description, startTime, endTime, allDay, location, color, reminderMinutes, categoryId, tagIds);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class EventUpdateRequest {\n");
    sb.append("    title: ").append(toIndentedString(title)).append("\n");
    sb.append("    description: ").append(toIndentedString(description)).append("\n");
    sb.append("    startTime: ").append(toIndentedString(startTime)).append("\n");
    sb.append("    endTime: ").append(toIndentedString(endTime)).append("\n");
    sb.append("    allDay: ").append(toIndentedString(allDay)).append("\n");
    sb.append("    location: ").append(toIndentedString(location)).append("\n");
    sb.append("    color: ").append(toIndentedString(color)).append("\n");
    sb.append("    reminderMinutes: ").append(toIndentedString(reminderMinutes)).append("\n");
    sb.append("    categoryId: ").append(toIndentedString(categoryId)).append("\n");
    sb.append("    tagIds: ").append(toIndentedString(tagIds)).append("\n");
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

